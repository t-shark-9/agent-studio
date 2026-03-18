import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const INTEGRATIONS_API = '/integrations';

export interface ComposioConnection {
  id: string;
  app: string;
  status: string;
  createdAt?: string;
}

interface UseComposioConnectionsOptions {
  pollIntervalMs?: number;
  notifyOnStatusChange?: boolean;
}

const labelFromAppId = (appId: string) => {
  const labels: Record<string, string> = {
    gmail: 'Gmail',
    googlecalendar: 'Google Calendar',
    googledrive: 'Google Drive',
    googledocs: 'Google Docs',
    googlesheets: 'Google Sheets',
    github: 'GitHub',
    notion: 'Notion',
    slack: 'Slack',
    linear: 'Linear',
    dropbox: 'Dropbox',
    outlook: 'Outlook',
    spotify: 'Spotify',
    youtube: 'YouTube',
    twitter: 'X',
  };

  return labels[appId] || appId.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

export function useComposioConnections(entityId: string, options: UseComposioConnectionsOptions = {}) {
  const { pollIntervalMs = 15000, notifyOnStatusChange = false } = options;
  const [connections, setConnections] = useState<ComposioConnection[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const previousActiveAppsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${INTEGRATIONS_API}/connections/${entityId}`);
      const data = await response.json();
      const nextConnections = data.connections || [];
      const nextActiveApps = new Set(
        nextConnections
          .filter((connection: ComposioConnection) => connection.status === 'active')
          .map((connection: ComposioConnection) => connection.app),
      );

      setConnections(nextConnections);
      setConfigured(data.configured !== false);

      if (notifyOnStatusChange) {
        if (hasLoadedRef.current) {
          for (const appId of nextActiveApps) {
            if (!previousActiveAppsRef.current.has(appId)) {
              toast.success(`${labelFromAppId(appId)} connected`);
            }
          }

          for (const appId of previousActiveAppsRef.current) {
            if (!nextActiveApps.has(appId)) {
              toast(`${labelFromAppId(appId)} disconnected`);
            }
          }
        }

        previousActiveAppsRef.current = nextActiveApps;
        hasLoadedRef.current = true;
      }
    } catch {
      setConfigured(false);
      setConnections([]);

      if (notifyOnStatusChange) {
        if (hasLoadedRef.current) {
          for (const appId of previousActiveAppsRef.current) {
            toast(`${labelFromAppId(appId)} disconnected`);
          }
        }

        previousActiveAppsRef.current = new Set();
        hasLoadedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [entityId, notifyOnStatusChange]);

  useEffect(() => {
    void refresh();

    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => window.clearInterval(id);
  }, [pollIntervalMs, refresh]);

  return { connections, configured, loading, refresh };
}