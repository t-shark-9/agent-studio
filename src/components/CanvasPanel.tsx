import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
}

interface CanvasPanelProps {
  canvas: CanvasData | null;
  onClose: () => void;
  onAction?: (action: string, data: Record<string, unknown>) => void;
}

export function CanvasPanel({ canvas, onClose, onAction }: CanvasPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!canvas) return null;

  return (
    <motion.div
      className={`bg-card border-l border-border flex flex-col shrink-0 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 border-none' : ''
      }`}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isFullscreen ? '100%' : 520, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3 shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
            {canvas.title}
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => window.open(canvas.url, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Canvas iframe */}
      <div className="flex-1 bg-[#1a1a2e]">
        <iframe
          src={canvas.embedUrl}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
          title={canvas.title}
        />
      </div>
    </motion.div>
  );
}
