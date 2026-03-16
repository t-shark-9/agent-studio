import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface Setting {
  key: string;
  label: string;
  description: string;
  htmlPatch: string;
  enabled: boolean;
  createdAt: number;
}

interface CanvasSettingsProps {
  canvasId: string | null;
  /** Bumped each time a new setting is created via edit chat */
  settingsVersion?: number;
}

export function CanvasSettings({ canvasId, settingsVersion }: CanvasSettingsProps) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!canvasId) return;
    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [canvasId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, settingsVersion]);

  const handleToggle = async (key: string) => {
    if (!canvasId) return;
    setToggling(key);
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/settings/${key}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => prev.map(s =>
          s.key === key ? { ...s, enabled: data.setting.enabled } : s
        ));
      }
    } catch {
      // ignore
    }
    setToggling(null);
  };

  if (!canvasId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Start an experience to configure settings.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      <div className="h-10 border-b border-border flex items-center justify-between px-3 shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Settings</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={fetchSettings} title="Refresh">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No settings yet.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Use the Chat panel to edit this canvas — each change becomes a toggleable setting here.
            </p>
          </div>
        ) : (
          settings.map(setting => (
            <div
              key={setting.key}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{setting.label}</p>
                {setting.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{setting.description}</p>
                )}
              </div>
              <button
                onClick={() => handleToggle(setting.key)}
                className="shrink-0"
                disabled={toggling === setting.key}
              >
                {setting.enabled ? (
                  <ToggleRight className={`h-6 w-6 text-primary ${toggling === setting.key ? 'opacity-50' : ''}`} />
                ) : (
                  <ToggleLeft className={`h-6 w-6 text-muted-foreground ${toggling === setting.key ? 'opacity-50' : ''}`} />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
