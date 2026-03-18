import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, TestTube2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ServiceIcon } from '@/components/ServiceIcons';

const INTEGRATIONS_API = '/integrations';

interface ProviderField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  secret?: boolean;
  placeholder?: string;
}

interface ProviderDefinition {
  id: string;
  name: string;
  description: string;
  bridgeBacked?: boolean;
  fields: ProviderField[];
}

interface ProviderConfigState {
  id: string;
  configured: boolean;
  enabled: boolean;
  updatedAt: string | null;
  lastTestAt: string | null;
  lastTestResult: { ok?: boolean; error?: string; summary?: string } | null;
  values: Record<string, string>;
  secrets: Record<string, boolean>;
}

export function SmartHomeConnections() {
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [configs, setConfigs] = useState<Record<string, ProviderConfigState>>({});
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [statusMap, setStatusMap] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [providersRes, configsRes] = await Promise.all([
        fetch(`${INTEGRATIONS_API}/smart-home/providers`),
        fetch(`${INTEGRATIONS_API}/smart-home/config`),
      ]);

      const providersData = await providersRes.json();
      const configsData = await configsRes.json();
      const nextProviders: ProviderDefinition[] = providersData.providers || [];
      const nextConfigsArray: ProviderConfigState[] = configsData.configs || [];
      const nextConfigs: Record<string, ProviderConfigState> = {};
      const nextDrafts: Record<string, Record<string, string>> = {};
      const nextEnabled: Record<string, boolean> = {};

      for (const config of nextConfigsArray) {
        nextConfigs[config.id] = config;
      }

      for (const provider of nextProviders) {
        const config = nextConfigs[provider.id] || {
          id: provider.id,
          configured: false,
          enabled: true,
          updatedAt: null,
          lastTestAt: null,
          lastTestResult: null,
          values: {},
          secrets: {},
        };

        nextEnabled[provider.id] = config.enabled !== false;
        nextDrafts[provider.id] = Object.fromEntries(
          provider.fields.map(field => [field.key, String(config.values[field.key] || '')]),
        );
      }

      setProviders(nextProviders);
      setConfigs(nextConfigs);
      setDrafts(nextDrafts);
      setEnabledMap(nextEnabled);
    } catch {
      setStatusMap({
        global: {
          type: 'error',
          message: 'Smart-home integrations service is not reachable right now.',
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setDraftValue = (providerId: string, fieldKey: string, value: string) => {
    setDrafts(current => ({
      ...current,
      [providerId]: {
        ...(current[providerId] || {}),
        [fieldKey]: value,
      },
    }));
  };

  const handleSave = async (providerId: string) => {
    setSavingId(providerId);
    try {
      const response = await fetch(`${INTEGRATIONS_API}/smart-home/config/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: enabledMap[providerId] !== false,
          config: drafts[providerId] || {},
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Save failed');

      setStatusMap(current => ({
        ...current,
        [providerId]: { type: 'success', message: 'Configuration saved.' },
      }));
      await fetchData();
    } catch (error) {
      setStatusMap(current => ({
        ...current,
        [providerId]: { type: 'error', message: error instanceof Error ? error.message : 'Save failed' },
      }));
    } finally {
      setSavingId(null);
    }
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const response = await fetch(`${INTEGRATIONS_API}/smart-home/test/${providerId}`, {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Connectivity test failed');

      setStatusMap(current => ({
        ...current,
        [providerId]: { type: 'success', message: payload.result?.summary || 'Connection successful.' },
      }));
      await fetchData();
    } catch (error) {
      setStatusMap(current => ({
        ...current,
        [providerId]: { type: 'error', message: error instanceof Error ? error.message : 'Connectivity test failed' },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleReset = async (providerId: string) => {
    setDeletingId(providerId);
    try {
      const response = await fetch(`${INTEGRATIONS_API}/smart-home/config/${providerId}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Reset failed');

      setStatusMap(current => ({
        ...current,
        [providerId]: { type: 'success', message: 'Configuration removed.' },
      }));
      await fetchData();
    } catch (error) {
      setStatusMap(current => ({
        ...current,
        [providerId]: { type: 'error', message: error instanceof Error ? error.message : 'Reset failed' },
      }));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Smart Home Stack</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Configure Home Assistant, MQTT, and the local bridge that fans out to Samsung, Apple Home, Alexa, and Bluetooth devices.
          </p>
        </div>
        <button onClick={fetchData} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {statusMap.global && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
          {statusMap.global.message}
        </div>
      )}

      <div className="grid gap-3">
        {providers.map(provider => {
          const config = configs[provider.id];
          const draft = drafts[provider.id] || {};
          const status = statusMap[provider.id];
          const enabled = enabledMap[provider.id] !== false;

          return (
            <div key={provider.id} className="rounded-xl border border-border bg-card/70 p-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ServiceIcon id={provider.id} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{provider.name}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config?.configured ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {config?.configured ? 'Configured' : 'Not configured'}
                      </span>
                      {provider.bridgeBacked && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                          Bridge-backed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{provider.description}</p>
                    {config?.updatedAt && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Updated {new Date(config.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start rounded-full border border-border px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground">Enabled</span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={checked => setEnabledMap(current => ({ ...current, [provider.id]: checked }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {provider.fields.map(field => {
                  const secretSaved = config?.secrets?.[field.key] === true;
                  const placeholder = field.secret && secretSaved
                    ? 'Saved in backend. Leave blank to keep.'
                    : field.placeholder || '';

                  return (
                    <label key={field.key} className="space-y-1.5">
                      <span className="text-[11px] font-medium text-foreground">
                        {field.label}
                        {field.required ? ' *' : ''}
                      </span>
                      <Input
                        type={field.secret ? 'password' : field.type === 'url' ? 'url' : 'text'}
                        value={draft[field.key] || ''}
                        placeholder={placeholder}
                        onChange={event => setDraftValue(provider.id, field.key, event.target.value)}
                      />
                      {field.secret && secretSaved && (
                        <span className="block text-[10px] text-muted-foreground">A secret is already stored for this field.</span>
                      )}
                    </label>
                  );
                })}
              </div>

              {(status || config?.lastTestResult) && (
                <div className={`rounded-lg px-3 py-2 text-[11px] ${status?.type === 'error' || config?.lastTestResult?.ok === false ? 'border border-destructive/30 bg-destructive/5 text-destructive' : 'border border-primary/20 bg-primary/5 text-primary'}`}>
                  {status?.message || config?.lastTestResult?.summary || config?.lastTestResult?.error}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleSave(provider.id)} disabled={savingId === provider.id}>
                  {savingId === provider.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTest(provider.id)} disabled={testingId === provider.id}>
                  {testingId === provider.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <TestTube2 className="h-3.5 w-3.5" />}
                  Test
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleReset(provider.id)} disabled={deletingId === provider.id}>
                  {deletingId === provider.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Reset
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
