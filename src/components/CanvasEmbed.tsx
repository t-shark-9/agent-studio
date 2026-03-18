import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CanvasEmbedProps {
  /** Server-side canvas ID — loads from /canvas/embed/:id with SSE */
  canvasId?: string;
  /** Raw HTML to show instantly via srcdoc (used before canvas is registered) */
  html?: string;
  onCanvasAction: (action: string, payload: Record<string, unknown>) => void;
}

// allow-same-origin is required for server-backed canvases (EventSource, DOM access).
// srcdoc iframes use a tighter sandbox — no allow-same-origin — since the bridge
// is inlined and the CSS link loads as no-cors (no credential sharing needed).
const CANVAS_SANDBOX_SRC = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation';
const CANVAS_SANDBOX_SRCDOC = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation';

// Inlined so srcdoc iframes never need to fetch /canvas-bridge.js externally.
const CANVAS_BRIDGE_INLINE = `
window.canvasAction = function canvasAction(action, data) {
  window.parent.postMessage({ type: 'canvas-action', action, data }, '*');
};
window.parent.postMessage({ type: 'canvas-ready', preview: true }, '*');
`;

function wrapHtml(html: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="stylesheet" href="/canvas/static/design-system.css">
</head><body>
<div id="canvas-root">${html}</div>
<script>${CANVAS_BRIDGE_INLINE}</script>
</body></html>`;
}

export function CanvasEmbed({ canvasId, html, onCanvasAction }: CanvasEmbedProps) {
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

  const useSrcdoc = !canvasId && html;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {useSrcdoc ? (
        <iframe
          ref={iframeRef}
          srcDoc={wrapHtml(html)}
          className="w-full flex-1 border-0"
          sandbox={CANVAS_SANDBOX_SRCDOC}
          allow="clipboard-write; autoplay; encrypted-media; fullscreen"
          title="Canvas Experience"
        />
      ) : (
        <iframe
          ref={iframeRef}
          src={canvasId ? `/canvas/embed/${canvasId}` : 'about:blank'}
          className="w-full flex-1 border-0"
          sandbox={CANVAS_SANDBOX_SRC}
          allow="clipboard-write; autoplay; encrypted-media; fullscreen"
          title="Canvas Experience"
        />
      )}
    </motion.div>
  );
}
