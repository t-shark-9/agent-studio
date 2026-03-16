import { useState, useRef, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Paperclip, Sparkles, Plane, UtensilsCrossed, Image,
  Code2, Music, ShoppingBag, Lightbulb, FileText, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttachedFile } from './MessageComposer';

const SUGGESTIONS = [
  { label: 'Book a restaurant in Stockholm', icon: UtensilsCrossed, prompt: 'Book a restaurant in Stockholm for 2 people tonight' },
  { label: 'Plan a weekend trip', icon: Plane, prompt: 'Plan a weekend trip to Barcelona' },
  { label: 'Generate a logo', icon: Image, prompt: 'Create a modern minimalist logo for a tech startup' },
  { label: 'Build a landing page', icon: Code2, prompt: 'Build a sleek landing page for my SaaS product' },
  { label: 'Create a playlist', icon: Music, prompt: 'Create a curated playlist for a dinner party' },
  { label: 'Compare products', icon: ShoppingBag, prompt: 'Compare the latest smartphones and recommend one' },
];

const GREETING = (() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
})();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/*,.pdf,.doc,.docx,.txt,.csv,.json,.md,.html,.css,.js,.ts,.py';

interface WelcomeScreenProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
}

export function WelcomeScreen({ onSend }: WelcomeScreenProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
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

  const handleSuggestion = (prompt: string) => {
    onSend(prompt);
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
          setFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }
      newFiles.push(attached);
    }
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pb-12">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
          <Sparkles className="h-3 w-3" />
          Agent Studio
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          {GREETING}
        </h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          What would you like to create today?
        </p>
      </motion.div>

      {/* Main input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-2xl mb-6"
      >
        <div
          className={`rounded-2xl border bg-card shadow-lg transition-all duration-200 ${
            focused
              ? 'border-primary/50 shadow-xl shadow-primary/5 ring-1 ring-primary/20'
              : 'border-border'
          }`}
        >
          {/* Attached files */}
          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap p-3 pb-0">
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

          <div className="flex items-end gap-2 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
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

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Describe what you want to build, explore, or create..."
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[40px] max-h-[120px] py-2.5"
              rows={1}
            />

            <Button
              size="sm"
              className="h-10 w-10 p-0 shrink-0 rounded-xl"
              onClick={handleSend}
              disabled={!input.trim() && files.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Suggestion chips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap gap-2 justify-center max-w-2xl"
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            onClick={() => handleSuggestion(s.prompt)}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-card/80 hover:bg-primary/5 hover:border-primary/30 text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <s.icon className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
            {s.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Subtle hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-[11px] text-muted-foreground/50 flex items-center gap-1.5"
      >
        <Lightbulb className="h-3 w-3" />
        OpenClaw creates interactive visual experiences, not just text
      </motion.p>
    </div>
  );
}
