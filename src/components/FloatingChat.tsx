import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageSquare, X, GripVertical, Send, Minimize2 } from 'lucide-react';
import { ChatMessageBubble, TypingIndicator } from './ChatMessageBubble';
import type { ChatMessage } from '@/types/chat';
import type { AttachedFile } from './MessageComposer';

interface FloatingChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string, files?: AttachedFile[]) => void;
}

export function FloatingChat({ messages, isLoading, onSend }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  }, [input, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadCount = messages.filter(m => m.role === 'assistant').length;

  return (
    <>
      {/* Full-screen drag boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragListener={false}
        className="fixed bottom-6 right-6 z-50"
        style={{ x: position.x, y: position.y }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-[360px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header — drag handle */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card cursor-grab active:cursor-grabbing select-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground flex-1">Chat</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Start a conversation...
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <ChatMessageBubble key={msg.id} message={msg} />
                    ))}
                    {isLoading && <TypingIndicator />}
                  </>
                )}
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-border bg-card p-2">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 resize-none rounded-lg bg-secondary border border-border px-3 py-2 text-sm min-h-[36px] max-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="bubble"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              onPointerDown={(e) => {
                // Allow drag on the bubble too
                // But only start drag on long press or if moved
              }}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:shadow-xl hover:shadow-primary/30 transition-shadow relative"
            >
              <MessageSquare className="h-6 w-6" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {messages.length > 99 ? '99+' : messages.length}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
