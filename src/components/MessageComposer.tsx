import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, ImageIcon, Sparkles, Plane, UtensilsCrossed, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AttachedFile {
  file: File;
  preview?: string; // data URL for images
  id: string;
}

interface MessageComposerProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  disabled?: boolean;
}

const QUICK_INTENTS = [
  { label: 'Plan a trip', icon: Plane, prompt: 'Plan a trip to ' },
  { label: 'Book restaurant', icon: UtensilsCrossed, prompt: 'Book a restaurant for ' },
  { label: 'Generate image', icon: Image, prompt: 'Create an image of ' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = 'image/*,.pdf,.doc,.docx,.txt,.csv,.json,.md,.html,.css,.js,.ts,.py';

export type { AttachedFile };

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!input.trim() && files.length === 0) || disabled) return;
    onSend(input.trim(), files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles: AttachedFile[] = [];

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) continue;
      const attached: AttachedFile = { file, id: crypto.randomUUID() };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          attached.preview = reader.result as string;
          setFiles(prev => [...prev]); // trigger re-render
        };
        reader.readAsDataURL(file);
      }
      newFiles.push(attached);
    }

    setFiles(prev => [...prev, ...newFiles]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

      {/* Attached files preview */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map(f => (
            <div
              key={f.id}
              className="relative group flex items-center gap-2 bg-secondary rounded-lg px-2.5 py-1.5 text-xs max-w-[200px]"
            >
              {f.preview ? (
                <img src={f.preview} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <p className="truncate text-foreground font-medium">{f.file.name}</p>
                <p className="text-muted-foreground">{formatSize(f.file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        {/* File attach button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={files.length > 0 ? 'Add a message about the file(s)...' : 'Type your message...'}
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
          disabled={(!input.trim() && files.length === 0) || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
