import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface Setting {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'text';
  defaultValue: boolean | string;
  htmlPatch?: string;
}

interface CanvasSettingsProps {
  canvasId: string | null;
  templateId?: string | null;
}

export function CanvasSettings({ canvasId, templateId }: CanvasSettingsProps) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    // Settings come from the template, not the canvas instance
    const id = templateId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_URL}/api/templates/${id}/settings`);
      if (res.ok) {
        const data = await res.json();
        const list: Setting[] = data.settings || [];
        setSettings(list);
        // Initialize toggles from defaults
        const defaults: Record<string, boolean> = {};
        for (const s of list) {
          defaults[s.key] = typeof s.defaultValue === 'boolean' ? s.defaultValue : false;
        }
        setActiveToggles(defaults);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (key: string) => {
    const newValue = !activeToggles[key];
    setActiveToggles(prev => ({ ...prev, [key]: newValue }));

    // Re-instantiate the canvas with updated settings
    if (!templateId || !canvasId) return;
    try {
      // Get the setting's HTML patch and apply/remove it
      const setting = settings.find(s => s.key === key);
      if (!setting?.htmlPatch) return;

      // Fetch current canvas HTML
      const srcRes = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/source`);
      if (!srcRes.ok) return;
      const { html } = await srcRes.json();

      let newHtml: string;
      if (newValue) {
        // Inject patch before </body> or at end
        const insertPoint = html.lastIndexOf('</body>');
        if (insertPoint >= 0) {
          newHtml = html.slice(0, insertPoint) + setting.htmlPatch + html.slice(insertPoint);
        } else {
          newHtml = html + setting.htmlPatch;
        }
      } else {
        // Remove the patch
        newHtml = html.replace(setting.htmlPatch, '');
      }

      await fetch(`${CANVAS_URL}/api/canvas/${canvasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: newHtml }),
      });
    } catch {
      // Revert on failure
      setActiveToggles(prev => ({ ...prev, [key]: !newValue }));
    }
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
              Ask Agent Studio to change this canvas — each change becomes a toggleable setting.
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
              >
                {activeToggles[setting.key] ? (
                  <ToggleRight className="h-6 w-6 text-primary" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
