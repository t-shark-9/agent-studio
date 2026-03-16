import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const CANVAS_SERVER = import.meta.env.VITE_CANVAS_SERVER || 'http://72.62.154.89:4200';

interface CanvasEmbedProps {
  canvasId: string;
  onCanvasAction: (action: string, payload: Record<string, unknown>) => void;
}

export function CanvasEmbed({ canvasId, onCanvasAction }: CanvasEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    const { type, action, data, payload } = event.data || {};

    if (type === 'canvas-action' && action) {
      onCanvasAction(action, data || payload || {});
    }
    if (type === 'canvasAction' && action) {
      onCanvasAction(action, payload || data || {});
    }
  }, [onCanvasAction]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      <iframe
        ref={iframeRef}
        src={`${CANVAS_SERVER}/embed/${canvasId}`}
        className="w-full flex-1 border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        allow="clipboard-write"
        title="Canvas Experience"
      />
    </motion.div>
  );
}
