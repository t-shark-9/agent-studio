import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, User, ExternalLink } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onOpenCanvas?: (canvasId: string) => void;
}

export function ChatMessageBubble({ message, onOpenCanvas }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const canvasId = (message.metadata as Record<string, unknown>)?.canvasId as string | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
        isUser ? 'bg-secondary' : 'bg-primary/15'
      }`}>
        {isUser ? (
          <User className="h-3.5 w-3.5 text-secondary-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-primary" />
        )}
      </div>

      <div className="max-w-[75%] space-y-2">
        <div className={`rounded-lg px-3.5 py-2.5 text-sm ${
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-surface text-foreground'
        }`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              code: ({ children }) => (
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{children}</code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Canvas card */}
        {canvasId && onOpenCanvas && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => onOpenCanvas(canvasId)}
            className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary hover:bg-primary/10 transition-colors w-full"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Open interactive experience</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="bg-surface rounded-lg px-4 py-3 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
