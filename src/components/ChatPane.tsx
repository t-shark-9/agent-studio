import { useRef, useEffect } from 'react';
import { ChatMessageBubble, TypingIndicator } from './ChatMessageBubble';
import { MessageComposer } from './MessageComposer';
import { IntentCardFlow } from './IntentCardFlow';
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
          <IntentCardFlow onComplete={onSend} />
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
