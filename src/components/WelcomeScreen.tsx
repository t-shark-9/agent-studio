import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Paperclip, Sparkles, Plane, UtensilsCrossed, Image,
  Lightbulb, FileText, X, LayoutGrid, Video, ShoppingBag, Globe, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AttachedFile } from './MessageComposer';

interface TemplateSetting {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'text';
  defaultValue: boolean | string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  settings?: TemplateSetting[];
  createdAt: number;
}

interface CategoryGroup {
  label: string;
  icon: React.ElementType;
  templates: Template[];
}

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

const INTENT_CARDS = [
  { key: 'booking', icon: UtensilsCrossed, label: 'Book a Restaurant', description: 'Find and reserve the perfect table', color: 'from-orange-500/20 to-red-500/20', prompt: 'Book a restaurant for me' },
  { key: 'media', icon: Image, label: 'Generate Image', description: 'Create stunning visuals with AI', color: 'from-purple-500/20 to-pink-500/20', prompt: 'Create an image for me' },
  { key: 'trip', icon: Plane, label: 'Plan a Trip', description: 'Build your perfect getaway itinerary', color: 'from-blue-500/20 to-cyan-500/20', prompt: 'Plan a trip for me' },
];

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  'restaurant-booking': { label: 'Dining', icon: UtensilsCrossed },
  'media-creation': { label: 'Creativity', icon: Image },
  'video-generation': { label: 'Creativity', icon: Video },
  'grocery-shopping': { label: 'Shopping', icon: ShoppingBag },
  'trip-planning': { label: 'Travel', icon: Plane },
  'flight-search': { label: 'Travel', icon: Globe },
};

const GREETING = (() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
})();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/*,.pdf,.doc,.docx,.txt,.csv,.json,.md,.html,.css,.js,.ts,.py';

function deduplicateTemplates(templates: Template[]): Template[] {
  const seen = new Map<string, Template>();
  for (const t of templates) {
    // Keep the most recent version of each name
    const key = t.name.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing || t.createdAt > existing.createdAt) {
      seen.set(key, t);
    }
  }
  return Array.from(seen.values());
}

function groupByCategory(templates: Template[]): CategoryGroup[] {
  const groups = new Map<string, Template[]>();

  for (const t of templates) {
    const meta = CATEGORY_META[t.category];
    const groupLabel = meta?.label || 'Other';
    if (!groups.has(groupLabel)) groups.set(groupLabel, []);
    groups.get(groupLabel)!.push(t);
  }

  const result: CategoryGroup[] = [];
  for (const [label, tpls] of groups) {
    const firstCat = tpls[0]?.category || '';
    const meta = CATEGORY_META[firstCat];
    result.push({
      label,
      icon: meta?.icon || LayoutGrid,
      templates: tpls.sort((a, b) => b.createdAt - a.createdAt),
    });
  }

  // Sort groups: Creativity, Dining, Travel, Shopping, Other
  const order = ['Creativity', 'Dining', 'Travel', 'Shopping', 'Other'];
  return result.sort((a, b) => {
    const ai = order.indexOf(a.label);
    const bi = order.indexOf(b.label);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

interface WelcomeScreenProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  onUseTemplate?: (templateId: string) => void;
}

export function WelcomeScreen({ onSend, onUseTemplate }: WelcomeScreenProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [focused, setFocused] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`${CANVAS_URL}/api/templates`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Template[]) => setTemplates(deduplicateTemplates(data)))
      .catch(() => {});
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

  const categoryGroups = groupByCategory(templates);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 min-h-0">
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

        {/* Intent cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 w-full max-w-2xl mb-6"
        >
          {INTENT_CARDS.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.06 }}
            >
              <Card
                className="group cursor-pointer border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all duration-300"
                onClick={() => onSend(card.prompt)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`h-10 w-10 mx-auto rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mb-0.5">{card.label}</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Templates by category */}
        {categoryGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="w-full max-w-2xl mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Templates</span>
            </div>
            <div className="space-y-3">
              {categoryGroups.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <group.icon className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-[11px] font-medium text-muted-foreground">{group.label}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.templates.map(tpl => (
                      <Card
                        key={tpl.id}
                        className="group cursor-pointer border-border hover:border-primary/30 bg-card/50 hover:bg-primary/5 transition-all"
                        onClick={() => onUseTemplate?.(tpl.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-[11px] font-semibold text-foreground mb-0.5 truncate">{tpl.name}</h4>
                            {tpl.settings && tpl.settings.length > 0 && (
                              <div className="flex items-center gap-0.5 shrink-0" title={`${tpl.settings.length} customizable setting${tpl.settings.length > 1 ? 's' : ''}`}>
                                <Settings className="h-2.5 w-2.5 text-muted-foreground/60" />
                                <span className="text-[9px] text-muted-foreground/60">{tpl.settings.length}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{tpl.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5 mb-4"
        >
          <Lightbulb className="h-3 w-3" />
          Agent Studio creates interactive visual experiences, not just text
        </motion.p>
      </div>

      {/* Chat input pinned at bottom */}
      <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm p-3">
        <div className="max-w-2xl mx-auto">
          <div
            className={`rounded-2xl border bg-card shadow-sm transition-all duration-200 ${
              focused
                ? 'border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20'
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
        </div>
      </div>
    </div>
  );
}
