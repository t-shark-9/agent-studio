import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItineraryWidget } from './widgets/ItineraryWidget';
import { BookingWidget } from './widgets/BookingWidget';
import { MediaWidget } from './widgets/MediaWidget';
import { CanvasEmbed } from './CanvasEmbed';
import type { ContextType } from '@/types/chat';

interface ContextPanelProps {
  contextType: ContextType;
  canvasId?: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAction: (message: string) => void;
}

export function ContextPanel({ contextType, canvasId, collapsed, onToggleCollapse, onAction }: ContextPanelProps) {
  if (contextType === 'chat' && collapsed && !canvasId) return null;

  const handleCanvasAction = (action: string, payload: Record<string, unknown>) => {
    // Forward canvas actions back into the chat as user messages
    const summary = payload.summary || payload.label || action;
    onAction(`[Canvas] ${summary}`);
  };

  const renderContent = () => {
    // If there's an active canvas, show the iframe
    if (canvasId) {
      return <CanvasEmbed canvasId={canvasId} onCanvasAction={handleCanvasAction} />;
    }

    // Otherwise fall back to built-in widgets
    switch (contextType) {
      case 'trip':
        return <ItineraryWidget onAction={onAction} />;
      case 'booking':
        return <BookingWidget onAction={onAction} />;
      case 'media':
        return <MediaWidget onAction={onAction} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-center p-6">
            <p className="text-sm text-muted-foreground">
              Start a conversation to see contextual tools here.
            </p>
          </div>
        );
    }
  };

  return (
    <motion.div
      className="bg-card border-l border-border flex flex-col shrink-0 overflow-hidden"
      animate={{ width: collapsed ? 0 : 400 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {canvasId ? 'CANVAS' : contextType === 'chat' ? 'CONTEXT' : contextType}
              </span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggleCollapse}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
