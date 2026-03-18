import { nativeRuntime } from '@/lib/nativeRuntime';
import { Monitor, Smartphone, Globe, Terminal, Cloud } from 'lucide-react';

const platformConfig = {
  desktop: {
    icon: Monitor,
    label: 'Desktop',
    terminalLabel: 'Terminal verfügbar',
    terminalIcon: Terminal,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  ios: {
    icon: Smartphone,
    label: 'iPhone',
    terminalLabel: 'Terminal nur über Remote Agent',
    terminalIcon: Cloud,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/20',
  },
  web: {
    icon: Globe,
    label: 'Web',
    terminalLabel: 'Terminal nur über Remote Agent',
    terminalIcon: Cloud,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
} as const;

export function RuntimeBadge({ compact = false }: { compact?: boolean }) {
  const platform = nativeRuntime.platform;
  const config = platformConfig[platform];
  const Icon = config.icon;
  const TermIcon = config.terminalIcon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium ${config.bg} ${config.border} border ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${config.bg} ${config.border} border`}>
      <div className={`flex items-center gap-1.5 ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{config.label}</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TermIcon className="h-3 w-3" />
        <span>{config.terminalLabel}</span>
      </div>
    </div>
  );
}
