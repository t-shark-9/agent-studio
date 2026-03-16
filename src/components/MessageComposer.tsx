import { useState, type KeyboardEvent } from 'react';
import { Send, Plane, UtensilsCrossed, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const QUICK_INTENTS = [
  { label: 'Plan a trip', icon: Plane, prompt: 'Plan a trip to ' },
  { label: 'Book restaurant', icon: UtensilsCrossed, prompt: 'Book a restaurant for ' },
  { label: 'Generate image', icon: Image, prompt: 'Create an image of ' },
];

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-3 space-y-2">
      {/* Quick intent buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_INTENTS.map(intent => (
          <Button
            key={intent.label}
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5 border-border text-muted-foreground hover:text-primary hover:border-primary/30"
            onClick={() => setInput(intent.prompt)}
          >
            <intent.icon className="h-3 w-3" />
            {intent.label}
          </Button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[40px] max-h-[120px] resize-none bg-secondary border-border text-sm pr-10"
            disabled={disabled}
            rows={1}
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
        </div>
        <Button
          size="sm"
          className="h-10 w-10 p-0 shrink-0"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
