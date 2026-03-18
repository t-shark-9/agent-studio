import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, RefreshCw, SlidersHorizontal, Sparkles, LayoutPanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AGENT_MODELS, normalizeAgentModelId } from '@/components/StatusBar';

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

interface AppSettings {
  defaultModel: string;
  defaultOverlay: 'chat' | 'code' | 'settings';
  overlayWidth: number;
  streamPreview: boolean;
  compactMode: boolean;
  reduceMotion: boolean;
  confirmSessionDelete: boolean;
  autoOpenSettingsAfterEdit: boolean;
}

const APP_SETTINGS_KEY = 'agent-studio.settings.v1';

const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultModel: 'claude-sonnet-4.6',
  defaultOverlay: 'code',
  overlayWidth: 420,
  streamPreview: true,
  compactMode: false,
  reduceMotion: false,
  confirmSessionDelete: true,
  autoOpenSettingsAfterEdit: false,
};

function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      defaultModel: normalizeAgentModelId(parsed.defaultModel || DEFAULT_APP_SETTINGS.defaultModel),
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function CanvasSettings({ canvasId, settingsVersion }: CanvasSettingsProps) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    if (appSettings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }

    if (appSettings.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [appSettings.compactMode, appSettings.reduceMotion]);

  const saveAppSettings = useCallback((next: AppSettings) => {
    setAppSettings(next);
    try {
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('agent-studio:settings-changed', { detail: next }));
    } catch {
      // ignore
    }
  }, []);

  const updateAppSettings = useCallback((patch: Partial<AppSettings>) => {
    const next = { ...appSettings, ...patch };
    saveAppSettings(next);
  }, [appSettings, saveAppSettings]);

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
    if (canvasId) fetchSettings();
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
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={canvasId ? fetchSettings : undefined}
          title={canvasId ? 'Refresh canvas settings' : 'No canvas selected'}
          disabled={!canvasId}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 h-9 w-full bg-secondary/70">
            <TabsTrigger value="general" className="text-[11px] px-1.5">General</TabsTrigger>
            <TabsTrigger value="workspace" className="text-[11px] px-1.5">Workspace</TabsTrigger>
            <TabsTrigger value="model" className="text-[11px] px-1.5">Model</TabsTrigger>
            <TabsTrigger value="canvas" className="text-[11px] px-1.5">Canvas</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-3 space-y-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Compact mode</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Tighter spacing for denser workspace layout.</p>
                </div>
                <Switch
                  checked={appSettings.compactMode}
                  onCheckedChange={(checked) => updateAppSettings({ compactMode: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Reduce motion</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Limit panel and transition animations.</p>
                </div>
                <Switch
                  checked={appSettings.reduceMotion}
                  onCheckedChange={(checked) => updateAppSettings({ reduceMotion: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Confirm before deleting sessions</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Show a safety prompt before irreversible deletes.</p>
                </div>
                <Switch
                  checked={appSettings.confirmSessionDelete}
                  onCheckedChange={(checked) => updateAppSettings({ confirmSessionDelete: checked })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workspace" className="mt-3 space-y-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LayoutPanelLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">Default overlay tab</p>
                </div>
                <Select
                  value={appSettings.defaultOverlay}
                  onValueChange={(value: 'chat' | 'code' | 'settings') => updateAppSettings({ defaultOverlay: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat" className="text-xs">Chat</SelectItem>
                    <SelectItem value="code" className="text-xs">Code</SelectItem>
                    <SelectItem value="settings" className="text-xs">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Overlay width</p>
                  <span className="text-[10px] text-muted-foreground">{appSettings.overlayWidth}px</span>
                </div>
                <Slider
                  value={[appSettings.overlayWidth]}
                  min={320}
                  max={720}
                  step={10}
                  onValueChange={(value) => updateAppSettings({ overlayWidth: value[0] })}
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Open settings after edit</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Jump to settings tab automatically when an edit completes.</p>
                </div>
                <Switch
                  checked={appSettings.autoOpenSettingsAfterEdit}
                  onCheckedChange={(checked) => updateAppSettings({ autoOpenSettingsAfterEdit: checked })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="mt-3 space-y-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">Default model</p>
                </div>
                <Select
                  value={appSettings.defaultModel}
                  onValueChange={(value) => updateAppSettings({ defaultModel: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id} className="text-xs">
                        {model.label} ({model.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Live stream preview</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Show code updates in real-time while generation streams.</p>
                </div>
                <Switch
                  checked={appSettings.streamPreview}
                  onCheckedChange={(checked) => updateAppSettings({ streamPreview: checked })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="canvas" className="mt-3 space-y-2">
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">Canvas patches</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Every edit patch can be toggled on or off for the active canvas.
              </p>
            </div>

            {!canvasId ? (
              <div className="text-center py-8">
                <Settings className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Open a canvas to manage patch toggles.</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-20">
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            ) : settings.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No canvas settings yet.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Use the Chat panel to edit this canvas. Each edit becomes a toggle here.
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
          </TabsContent>
        </Tabs>

        <div className="mt-3 pt-3 border-t border-border/70">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => saveAppSettings(DEFAULT_APP_SETTINGS)}
          >
            Reset to defaults
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
