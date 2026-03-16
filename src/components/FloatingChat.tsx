import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Send, Paperclip, GripVertical, Maximize2, Minimize2, FileText, X, Sparkles, Cpu } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AGENT_MODELS } from '@/components/StatusBar';
import type { AttachedFile } from './MessageComposer';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/*,.pdf,.doc,.docx,.txt,.csv,.json,.md,.html,.css,.js,.ts,.py';

interface FloatingChatProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  isLoading?: boolean;
  startCentered?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function FloatingChat({ onSend, isLoading, startCentered, selectedModel, onModelChange }: FloatingChatProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [focused, setFocused] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  const handleSend = useCallback(() => {
    if ((!input.trim() && files.length === 0) || isLoading) return;
    onSend(input.trim(), files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
  }, [input, files, onSend, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // Compact mode: just a small pill with input
  if (isCompact) {
    return (
      <>
        <div ref={constraintsRef} className="absolute inset-0 pointer-events-none z-40" />
        <motion.div
          drag
          dragControls={dragControls}
          dragMomentum={false}
          dragConstraints={constraintsRef}
          dragListener={false}
          className="absolute bottom-6 right-6 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-card border border-border rounded-full shadow-xl pl-2 pr-1 py-1"
          >
            <div
              onPointerDown={e => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing p-1"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-[200px]"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsCompact(false)}
              className="h-8 w-8 shrink-0 rounded-full hover:bg-secondary flex items-center justify-center"
            >
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        </motion.div>
      </>
    );
  }

  // Full mode: centered card with input, draggable
  return (
    <>
      <div ref={constraintsRef} className="absolute inset-0 pointer-events-none z-40" />
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragListener={false}
        initial={startCentered ? { opacity: 0, y: 20 } : { opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute z-50 ${startCentered ? 'inset-x-0 top-[30%] mx-auto' : 'bottom-6 left-1/2 -translate-x-1/2'}`}
        style={{ width: 'min(95%, 640px)' }}
      >
        <div
          className={`rounded-2xl border bg-card/95 backdrop-blur-md shadow-2xl transition-all duration-200 ${
            focused
              ? 'border-primary/50 shadow-xl shadow-primary/5 ring-1 ring-primary/20'
              : 'border-border'
          }`}
        >
          {/* Drag handle + minimize */}
          <div
            onPointerDown={e => dragControls.start(e)}
            className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30" />
              {isLoading && (
                <div className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Generating...
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCompact(true)}
              className="h-5 w-5 rounded flex items-center justify-center hover:bg-secondary transition-colors"
              title="Minimize"
            >
              <Minimize2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>

          {/* Attached files */}
          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap px-3 pb-1">
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

          {/* Input row */}
          <div className="flex items-end gap-2 px-3 pb-3">
            <button
              className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={handleFileSelect}
            />

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Describe what you want to build, explore, or create..."
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[40px] max-h-[120px] py-2.5"
              rows={1}
              disabled={isLoading}
            />

            <button
              onClick={handleSend}
              disabled={(!input.trim() && files.length === 0) || isLoading}
              className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {/* Model selector */}
          <div className="flex items-center gap-1.5 px-3 pb-2">
            <Cpu className="h-3 w-3 text-muted-foreground" />
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="h-6 w-auto min-w-[130px] border-0 bg-transparent text-[11px] text-muted-foreground px-1 py-0 shadow-none hover:text-foreground">
                <SelectValue>
                  {AGENT_MODELS.find(m => m.id === selectedModel)?.label || selectedModel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AGENT_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id} className="text-xs">
                    <span className="font-medium">{model.label}</span>
                    <span className="text-muted-foreground ml-1">({model.provider})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>
    </>
  );
}
