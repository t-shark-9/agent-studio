import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Layout } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
}

interface ChatMessageProps {
  message: ChatMessageType;
  onOpenCanvas?: (canvas: CanvasData) => void;
}

export function ChatMessageBubble({ message, onOpenCanvas }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const canvas = (message.metadata as Record<string, unknown>)?.canvas as CanvasData | undefined;

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
        {message.content && (
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
        )}

        {canvas && onOpenCanvas && (
          <button
            onClick={() => onOpenCanvas(canvas)}
            className="group w-full text-left rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layout className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">{canvas.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">Interactive experience — click to open</p>
            <span className="inline-block mt-2 text-[10px] font-semibold tracking-wider uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full group-hover:bg-primary/90">
              Open Canvas
            </span>
          </button>
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
