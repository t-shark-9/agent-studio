import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessageBubble, TypingIndicator } from './ChatMessageBubble';
import { MessageComposer } from './MessageComposer';
import type { ChatMessage } from '@/types/chat';

interface ChatPaneProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
}

export function ChatPane({ messages, isLoading, onSend }: ChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Nexus Agent</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Your AI-powered assistant for trip planning, restaurant booking, and media generation. 
                Start a conversation or use the quick actions.
              </p>
            </div>
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

      {/* Composer */}
      <MessageComposer onSend={onSend} disabled={isLoading} />
    </div>
  );
}
