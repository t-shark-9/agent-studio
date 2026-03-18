import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const INTEGRATIONS_API = '/integrations';

export interface WhatsAppChannelInstance {
  name: string;
  status: string;
  connected: boolean;
  number: string | null;
  owner: string | null;
}

export interface WhatsAppChannelStatus {
  configured: boolean;
  available: boolean;
  live: boolean;
  primaryInstance: WhatsAppChannelInstance | null;
  deepLink: string | null;
  instances: WhatsAppChannelInstance[];
  error?: string;
}

interface UseWhatsAppChannelOptions {
  pollIntervalMs?: number;
  notifyOnStatusChange?: boolean;
}

export function useWhatsAppChannel(options: UseWhatsAppChannelOptions = {}) {
  const { pollIntervalMs = 20000, notifyOnStatusChange = false } = options;
  const [status, setStatus] = useState<WhatsAppChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const lastLiveRef = useRef<boolean | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${INTEGRATIONS_API}/channels/whatsapp`);
      const data = await response.json();
      setStatus(data);

      if (notifyOnStatusChange) {
        const nextLive = !!data?.live;
        if (hasLoadedRef.current && lastLiveRef.current !== null && lastLiveRef.current !== nextLive) {
          if (nextLive) {
            toast.success('WhatsApp channel connected');
          } else {
            toast.error('WhatsApp channel disconnected');
          }
        }
        lastLiveRef.current = nextLive;
        hasLoadedRef.current = true;
      }
    } catch {
      const fallback = {
        configured: false,
        available: false,
        live: false,
        primaryInstance: null,
        deepLink: null,
        instances: [],
        error: 'unavailable',
      } satisfies WhatsAppChannelStatus;
      setStatus(fallback);

      if (notifyOnStatusChange) {
        if (hasLoadedRef.current && lastLiveRef.current) {
          toast.error('WhatsApp channel disconnected');
        }
        lastLiveRef.current = false;
        hasLoadedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [notifyOnStatusChange]);

  useEffect(() => {
    void refresh();

    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => window.clearInterval(id);
  }, [pollIntervalMs, refresh]);

  return { status, loading, refresh };
}