import { motion } from 'framer-motion';
import { AgentStudioLogo } from '@/components/AgentStudioLogo';

export function normalizeAgentModelId(modelId: string): string {
  switch (modelId) {
    case 'claude-sonnet-4-6':
      return 'claude-sonnet-4.6';
    case 'claude-opus-4-6':
      return 'claude-opus-4.6';
    case 'claude-haiku-4-5':
      return 'claude-haiku-4.5';
    default:
      return modelId;
  }
}

export const AGENT_MODELS = [
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-opus-4.6', label: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'OpenAI' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
] as const;

export function StatusBar() {
  return (
    <div className="h-10 bg-card border-b border-border flex items-center px-4 shrink-0">
      <div className="flex items-center gap-2">
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <AgentStudioLogo className="h-4 w-4" />
        <span className="text-xs font-mono text-primary font-semibold tracking-wide">AGENT STUDIO</span>
      </div>
    </div>
  );
}
