import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link2, Unlink, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceIcon } from '@/components/ServiceIcons';
import { useComposioConnections } from '@/hooks/useComposioConnections';

const INTEGRATIONS_API = '/integrations';

interface AppInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

interface Connection {
  id: string;
  app: string;
  status: string;
  createdAt: string;
}

interface ConnectedAccountsProps {
  entityId: string; // User ID or browser token
}

export function ConnectedAccounts({ entityId }: ConnectedAccountsProps) {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { connections, configured, loading, refresh } = useComposioConnections(entityId, {
    pollIntervalMs: 15000,
  });

  const fetchApps = useCallback(async () => {
    try {
      const appsRes = await fetch(`${INTEGRATIONS_API}/apps`);
      const appsData = await appsRes.json();
      setApps(appsData.apps || []);
    } catch {
      toast.error('Failed to load available Composio apps');
    }
  }, []);

  useEffect(() => { void fetchApps(); }, [fetchApps]);

  // Listen for OAuth callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'composio-callback') {
        void refresh();
        setConnecting(null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [refresh]);

  const handleConnect = async (appName: string) => {
    setConnecting(appName);
    try {
      const res = await fetch(`${INTEGRATIONS_API}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          entityId,
          redirectUrl: `${window.location.origin}/integrations/callback`,
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        const appLabel = apps.find(app => app.id === appName)?.name || appName;
        toast(`Continue in the popup to connect ${appLabel}`);
        // Open OAuth in popup
        const popup = window.open(data.redirectUrl, 'composio-oauth', 'width=600,height=700,left=200,top=100');
        // Poll for popup close
        const interval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(interval);
            void refresh();
            setConnecting(null);
          }
        }, 500);
      } else {
        toast.error('Connection could not be started');
        setConnecting(null);
      }
    } catch {
      toast.error('Failed to start connection');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      const response = await fetch(`${INTEGRATIONS_API}/connections/${connectionId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to disconnect connection');
      toast.success(`${apps.find(app => app.id === connection?.app)?.name || connection?.app || 'Service'} disconnected`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect connection');
    }
  };

  const connectedAppNames = new Set(connections.filter(c => c.status === 'active').map(c => c.app));

  const categories = [...new Set(apps.map(a => a.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-3 text-yellow-500/60" />
        <p className="text-sm font-medium text-foreground mb-1">Integrations Not Configured</p>
        <p className="text-xs text-muted-foreground mb-3">
          Set your Composio API key to enable service connections.
        </p>
        <a
          href="https://app.composio.dev/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Get API Key <ExternalLink className="h-3 w-3" />
        </a>
        <p className="text-[10px] text-muted-foreground mt-2">
          Then set <code className="bg-secondary px-1 py-0.5 rounded">COMPOSIO_API_KEY</code> environment variable and restart the integrations service.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Connected Accounts</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Connect your services so Agent Studio can work with your data
          </p>
        </div>
        <button onClick={() => void refresh()} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Connected */}
      {connections.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Connected</p>
          {connections.map(conn => {
            const app = apps.find(a => a.id === conn.app);
            return (
              <div key={conn.id} className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2.5">
                  <ServiceIcon id={conn.app} className="h-5 w-5" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{app?.name || conn.app}</p>
                    <p className="text-[10px] text-green-500">Connected</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(conn.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Disconnect"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available by category */}
      {categories.map(cat => {
        const catApps = apps.filter(a => a.category === cat && !connectedAppNames.has(a.id));
        if (catApps.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {cat}
            </p>
            {catApps.map(app => (
              <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-2.5">
                  <ServiceIcon id={app.id} className="h-5 w-5" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{app.name}</p>
                    <p className="text-[10px] text-muted-foreground">{app.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect(app.id)}
                  disabled={connecting === app.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium transition-colors disabled:opacity-50"
                >
                  {connecting === app.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Link2 className="h-3 w-3" />
                  )}
                  Connect
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </motion.div>
  );
}
