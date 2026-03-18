import { useState, useEffect } from 'react';
import { LogIn, ChevronDown, Link2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceIcon } from '@/components/ServiceIcons';
import { AgentStudioLogo } from '@/components/AgentStudioLogo';
import { useComposioConnections } from '@/hooks/useComposioConnections';
import { useWhatsAppChannel } from '@/hooks/useWhatsAppChannel';
import type { User } from '@supabase/supabase-js';

// Quick-connect apps shown in the header
const QUICK_APPS = [
  { id: 'gmail', name: 'Gmail' },
  { id: 'googlecalendar', name: 'Calendar' },
  { id: 'googledrive', name: 'Drive' },
  { id: 'notion', name: 'Notion' },
  { id: 'slack', name: 'Slack' },
  { id: 'github', name: 'GitHub' },
];

interface GlobalHeaderProps {
  user: User | null;
  onAuthClick: () => void;
  onAccountClick: (tab?: string) => void;
}

export function GlobalHeader({ user, onAuthClick, onAccountClick }: GlobalHeaderProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { status: whatsappStatus } = useWhatsAppChannel({ notifyOnStatusChange: true });
  const entityId = user?.id || 'anonymous';
  const { connections, refresh: refreshConnections } = useComposioConnections(entityId, {
    pollIntervalMs: 15000,
    notifyOnStatusChange: true,
  });

  // Listen for OAuth callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'composio-callback') {
        void refreshConnections();
        setConnecting(null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [refreshConnections]);

  const connectedApps = new Set(connections.filter(c => c.status === 'active').map(c => c.app));

  const handleQuickConnect = async (appId: string) => {
    setConnecting(appId);
    try {
      const res = await fetch('/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: appId,
          entityId,
          redirectUrl: `${window.location.origin}/integrations/callback`,
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        const appName = QUICK_APPS.find(app => app.id === appId)?.name || appId;
        toast(`Continue in the popup to connect ${appName}`);
        const popup = window.open(data.redirectUrl, 'composio-oauth', 'width=600,height=700,left=200,top=100');
        const interval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(interval);
            void refreshConnections();
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

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const initials = displayName ? displayName.charAt(0).toUpperCase() : '?';
  const whatsappLinked = !!whatsappStatus?.primaryInstance?.connected;

  return (
    <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <AgentStudioLogo className="h-6 w-6" />
        <span className="text-sm font-semibold text-foreground tracking-tight truncate">Agent Studio</span>
      </div>

      {/* Quick connections */}
      <div className="hidden md:flex items-center gap-1 ml-4">
        {QUICK_APPS.map(app => {
          const isConnected = connectedApps.has(app.id);
          const isConnecting = connecting === app.id;
          return (
            <button
              key={app.id}
              onClick={() => !isConnected && handleQuickConnect(app.id)}
              disabled={isConnected || isConnecting}
              title={isConnected ? `${app.name} connected` : `Connect ${app.name}`}
              className={`relative flex items-center justify-center w-7 h-7 rounded-md text-sm transition-all ${
                isConnected
                  ? 'bg-primary/10 cursor-default'
                  : 'hover:bg-secondary cursor-pointer opacity-40 hover:opacity-100'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <ServiceIcon id={app.id} className="h-4 w-4" />
              )}
              {isConnected && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card" />
              )}
            </button>
          );
        })}
        <button
          onClick={() => onAccountClick()}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1"
        >
          <Link2 className="h-3 w-3" />
          More
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      <button
        onClick={() => onAccountClick('connections')}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/15 transition-colors"
        title="Connect WhatsApp"
      >
        <ServiceIcon id="whatsapp" className="h-3.5 w-3.5" />
        <span>{whatsappLinked ? 'WhatsApp Linked' : 'Connect WhatsApp'}</span>
      </button>
      <a
        href="https://tjark-osterloh.de/blog/#download-app"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-[11px] sm:text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        title="Download App"
      >
        <span>Download</span>
      </a>

      {/* User */}
      {user ? (
        <button
          onClick={() => onAccountClick()}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {initials}
            </div>
          )}
          <span className="hidden sm:inline text-xs text-foreground font-medium max-w-[120px] truncate">{displayName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      ) : (
        <button
          onClick={onAuthClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] sm:text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      )}
    </header>
  );
}
