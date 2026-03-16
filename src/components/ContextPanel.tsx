import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItineraryWidget } from './widgets/ItineraryWidget';
import { BookingWidget } from './widgets/BookingWidget';
import { MediaWidget } from './widgets/MediaWidget';
import type { ContextType } from '@/types/chat';

interface ContextPanelProps {
  contextType: ContextType;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAction: (message: string) => void;
}

export function ContextPanel({ contextType, collapsed, onToggleCollapse, onAction }: ContextPanelProps) {
  if (contextType === 'chat' && collapsed) return null;

  const renderWidget = () => {
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
              Start a conversation to see contextual tools here. Try "Plan a trip" or "Create an image".
            </p>
          </div>
        );
    }
  };

  return (
    <motion.div
      className="bg-card border-l border-border flex flex-col shrink-0 overflow-hidden"
      animate={{ width: collapsed ? 0 : 340 }}
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
                {contextType === 'chat' ? 'CONTEXT' : contextType}
              </span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggleCollapse}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Widget Content */}
            <div className="flex-1 overflow-y-auto">
              {renderWidget()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
