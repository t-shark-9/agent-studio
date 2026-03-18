import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Paperclip, Plane, UtensilsCrossed, Image,
  Lightbulb, FileText, X, Video, ShoppingCart, Globe,
  Mountain, Clapperboard, LayoutGrid, Cpu, ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { AgentStudioLogo } from '@/components/AgentStudioLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AGENT_MODELS } from '@/components/StatusBar';
import type { AttachedFile } from './MessageComposer';
import { getCachedTemplates, getTemplates, type TemplateData } from '@/lib/templateCache';

/** Map icon name strings from template data to lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  'utensils-crossed': UtensilsCrossed,
  'mountain': Mountain,
  'clapperboard': Clapperboard,
  'shopping-cart': ShoppingCart,
  'plane': Plane,
  'image': Image,
  'video': Video,
  'globe': Globe,
  'clipboard-check': ClipboardCheck,
};

const FALLBACK_ICON: LucideIcon = LayoutGrid;
const FALLBACK_COLOR = 'from-gray-500/20 to-slate-500/20';

const DEFAULT_COLORS: Record<string, string> = {
  'restaurant-booking': 'from-orange-500/20 to-red-500/20',
  'video-generation': 'from-violet-500/20 to-purple-500/20',
  'grocery-shopping': 'from-green-500/20 to-emerald-500/20',
  'trip-planning': 'from-blue-500/20 to-cyan-500/20',
  'attendance': 'from-red-500/20 to-orange-500/20',
};

interface UniformCard {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  action: { type: 'send'; prompt: string } | { type: 'template'; templateId: string };
}

function templateToCard(tpl: TemplateData): UniformCard {
  const IconComp = (tpl.icon && ICON_MAP[tpl.icon]) || FALLBACK_ICON;
  const color = tpl.color || DEFAULT_COLORS[tpl.category] || FALLBACK_COLOR;
  return {
    id: tpl.id,
    icon: IconComp,
    label: tpl.name,
    description: tpl.description,
    color,
    action: { type: 'template', templateId: tpl.id },
  };
}

function deduplicateTemplates(templates: TemplateData[]): TemplateData[] {
  const seen = new Map<string, TemplateData>();
  for (const t of templates) {
    const key = t.name.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing || t.createdAt > existing.createdAt) {
      seen.set(key, t);
    }
  }
  return Array.from(seen.values());
}

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
  onUseTemplate?: (templateId: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function WelcomeScreen({ onSend, onUseTemplate, selectedModel, onModelChange }: WelcomeScreenProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [focused, setFocused] = useState(false);
  const [templates, setTemplates] = useState<TemplateData[]>(() => deduplicateTemplates(getCachedTemplates()));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Background refresh — cached data already shown instantly above
    getTemplates().then(data => setTemplates(deduplicateTemplates(data)));
  }, []);

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

  // Build card list from templates only
  const allCards: UniformCard[] = templates.map(templateToCard);

  const handleCardClick = (card: UniformCard) => {
    if (card.action.type === 'send') {
      onSend(card.action.prompt);
    } else {
      onUseTemplate?.(card.action.templateId);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
            <AgentStudioLogo className="h-4 w-4" />
            Agent Studio
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            {GREETING}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            What would you like to create today?
          </p>
        </motion.div>

        {/* Centered chat input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-2xl mb-6 sm:mb-8"
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

            <div className="flex items-end gap-2 p-2.5 sm:p-3">
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
            {/* Model selector */}
            <div className="flex items-center gap-1.5 px-3 pb-2">
              <Cpu className="h-3 w-3 text-muted-foreground" />
              <Select value={selectedModel} onValueChange={onModelChange}>
                <SelectTrigger className="h-6 w-full sm:w-auto min-w-0 sm:min-w-[130px] border-0 bg-transparent text-[11px] text-muted-foreground px-1 py-0 shadow-none hover:text-foreground max-w-[210px]">
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

        {/* Uniform card grid — intent cards + templates, all same style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl mb-5 sm:mb-6"
        >
          {allCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.04 }}
            >
              <Card
                className="group cursor-pointer border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all duration-300"
                onClick={() => handleCardClick(card)}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className={`h-10 w-10 mx-auto rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mb-0.5">{card.label}</h3>
                  <p className="hidden sm:block text-[10px] text-muted-foreground leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="hidden sm:flex text-[11px] text-muted-foreground/50 items-center gap-1.5"
        >
          <Lightbulb className="h-3 w-3" />
          Agent Studio creates interactive visual experiences, not just text
        </motion.p>
      </div>
    </div>
  );
}
