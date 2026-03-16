import { useRef, useEffect } from 'react';
import { ChatMessageBubble, TypingIndicator } from './ChatMessageBubble';
import { MessageComposer } from './MessageComposer';
import { IntentCardFlow } from './IntentCardFlow';
import type { ChatMessage } from '@/types/chat';
import type { AttachedFile } from './MessageComposer';

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
}

interface ChatPaneProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string, files?: AttachedFile[]) => void;
  onOpenCanvas?: (canvas: CanvasData) => void;
}

export function ChatPane({ messages, isLoading, onSend, onOpenCanvas }: ChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="h-full flex flex-col min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <IntentCardFlow onComplete={(msg) => onSend(msg)} />
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessageBubble key={msg.id} message={msg} onOpenCanvas={onOpenCanvas} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
      </div>

      <div className="shrink-0">
        <MessageComposer onSend={onSend} disabled={isLoading} />
      </div>
    </div>
  );
}
