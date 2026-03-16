import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff, Clock, LogIn, LogOut, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

export const OPENCLAW_MODELS = [
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-opus-4.6', label: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'OpenAI' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
] as const;

interface StatusBarProps {
  isEphemeral: boolean;
  onToggleEphemeral: () => void;
  onAuthClick: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function StatusBar({ isEphemeral, onToggleEphemeral, onAuthClick, selectedModel, onModelChange }: StatusBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentModel = OPENCLAW_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="h-10 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs font-mono text-primary font-semibold">OPENCLAW</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Model Selector */}
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-muted-foreground" />
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="h-6 w-auto min-w-[140px] border-border bg-secondary text-xs px-2 py-0">
              <SelectValue>
                {currentModel ? `${currentModel.label} (${currentModel.provider})` : selectedModel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {OPENCLAW_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  <span className="font-medium">{model.label}</span>
                  <span className="text-muted-foreground ml-1.5">via {model.provider}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(elapsed)}
        </div>

        <button
          onClick={onToggleEphemeral}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <AnimatePresence mode="wait">
            {isEphemeral ? (
              <motion.div key="eph" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <ShieldOff className="h-3.5 w-3.5 text-destructive" />
              </motion.div>
            ) : (
              <motion.div key="persist" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Shield className="h-3.5 w-3.5 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          {isEphemeral ? 'EPHEMERAL' : 'PERSISTENT'}
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={onAuthClick}
          >
            <LogIn className="h-3 w-3" />
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
