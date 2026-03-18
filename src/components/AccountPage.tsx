import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { User, LogOut, CreditCard, Link2, Shield, ArrowLeft, Bluetooth, Scan, X, Check, Home, MessageSquare, Layout, Trash2, Palette, Monitor, Sun, Moon, ChevronRight } from 'lucide-react';
import { readUsageLog, clearUsageLog, type UsageEntry } from '@/lib/usageLog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ConnectedAccounts } from '@/components/ConnectedAccounts';
import { SmartHomeConnections } from '@/components/SmartHomeConnections';
import { PricingPlans } from '@/components/PricingPlans';
import { ServiceIcon } from '@/components/ServiceIcons';
import { toast } from 'sonner';
import type { User as SupaUser, UserIdentity } from '@supabase/supabase-js';

type AccountTab = 'usage' | 'appearance' | 'account' | 'connections' | 'bluetooth' | 'plans';

const INTEGRATIONS_API = '/integrations';
const BT_DEVICES_KEY = 'agent-studio.bt-devices.v1';
interface BtDevice { id: string; name: string; pairedAt: string; }

const OAUTH_PROVIDERS = [
  {
    id: 'google', label: 'Google', description: 'Sign in with your Google account',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'azure', label: 'Microsoft', description: 'Sign in with your Microsoft account',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 23 23">
        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
        <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
      </svg>
    ),
  },
  {
    id: 'github', label: 'GitHub', description: 'Sign in with your GitHub account',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
] as const;

function AccountsTab({ identities, onRefresh }: { identities: UserIdentity[]; onRefresh: () => void }) {
  const [linking, setLinking] = useState<string | null>(null);
  const linkedProviders = new Set(identities.map(i => i.provider));

  const handleLink = async (provider: string) => {
    setLinking(provider);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider as Parameters<typeof supabase.auth.linkIdentity>[0]['provider'],
        options: { redirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link account');
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (identity: UserIdentity) => {
    if (identities.length <= 1) {
      toast.error('Cannot unlink – this is your only sign-in method');
      return;
    }
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) toast.error(error.message);
      else { toast.success('Account unlinked'); onRefresh(); }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to unlink');
    }
  };

  return (
    <div className="space-y-3">
      {OAUTH_PROVIDERS.map(p => {
        const isLinked = linkedProviders.has(p.id);
        const identity = identities.find(i => i.provider === p.id);
        return (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50">
            <div className="shrink-0">{p.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{p.label}</p>
              <p className="text-xs text-muted-foreground">
                {isLinked ? `Linked${(identity as UserIdentity & { email?: string })?.email ? ` · ${(identity as UserIdentity & { email?: string }).email}` : ''}` : p.description}
              </p>
            </div>
            {isLinked ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <Check className="h-3.5 w-3.5" /> Connected
                </span>
                {identity && identities.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive h-7"
                    onClick={() => void handleUnlink(identity)}>Unlink</Button>
                )}
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-xs h-8 shrink-0"
                disabled={linking === p.id} onClick={() => void handleLink(p.id)}>
                {linking === p.id ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground pt-2">
        Linked accounts let you sign in with multiple providers using the same account.
        Microsoft and GitHub require those providers to be enabled in the Supabase dashboard first.
      </p>
    </div>
  );
}

function BluetoothTab() {
  const [devices, setDevices] = useState<BtDevice[]>(() => {
    try { return JSON.parse(localStorage.getItem(BT_DEVICES_KEY) || '[]'); }
    catch { return []; }
  });
  const [scanning, setScanning] = useState(false);
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const saveDevices = (devs: BtDevice[]) => {
    setDevices(devs);
    localStorage.setItem(BT_DEVICES_KEY, JSON.stringify(devs));
  };

  const scanForDevice = async () => {
    if (!isSupported) return;
    setScanning(true);
    try {
      const device = await (navigator as unknown as { bluetooth: { requestDevice: (o: object) => Promise<{ id: string; name?: string }> } }).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      });
      const newDev: BtDevice = { id: device.id, name: device.name || `Device ${device.id.slice(0, 8)}`, pairedAt: new Date().toISOString() };
      saveDevices([newDev, ...devices.filter(d => d.id !== newDev.id)]);
      toast.success(`${newDev.name} added`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotFoundError') toast.error('Bluetooth error: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Bluetooth Devices</h2>
        <p className="text-xs text-muted-foreground">Pair and manage nearby Bluetooth devices.</p>
      </div>
      {!isSupported && (
        <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start gap-3">
          <Bluetooth className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Bluetooth not available</p>
            <p className="text-xs text-muted-foreground mt-0.5">Web Bluetooth requires Chrome or Edge on a secure (HTTPS) connection.</p>
          </div>
        </div>
      )}
      {isSupported && (
        <Button onClick={() => void scanForDevice()} disabled={scanning} className="gap-2">
          <Scan className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan for Devices'}
        </Button>
      )}
      {devices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paired Devices</h3>
          {devices.map(dev => (
            <div key={dev.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
              <Bluetooth className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{dev.name}</p>
                <p className="text-[11px] text-muted-foreground">Added {new Date(dev.pairedAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => saveDevices(devices.filter(d => d.id !== dev.id))}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors" title="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {isSupported && devices.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Bluetooth className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No devices paired yet</p>
          <p className="text-xs mt-1">Click Scan to discover nearby Bluetooth devices</p>
        </div>
      )}
    </div>
  );
}

interface AccountPageProps {
  onClose: () => void;
  initialTab?: AccountTab;
}

function WhatsAppConnectionPanel({ entityId }: { entityId: string }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [linkState, setLinkState] = useState<{
    linked: boolean;
    link: { phoneNumber: string; verifiedAt: string } | null;
    pending: { phoneNumber: string; expiresAt: string; attempts: number } | null;
  }>({ linked: false, link: null, pending: null });
  const didLoadRef = useRef(false);
  const prevLinkedRef = useRef(false);
  const prevPendingRef = useRef(false);
  const skipNextTransitionToastRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${INTEGRATIONS_API}/whatsapp/link?entityId=${encodeURIComponent(entityId)}`);
      const data = await response.json();
      setLinkState({
        linked: !!data.linked,
        link: data.link || null,
        pending: data.pending || null,
      });
      if (data.pending?.phoneNumber) setPhoneNumber(data.pending.phoneNumber);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load WhatsApp status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [entityId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => window.clearInterval(id);
  }, [entityId]);

  useEffect(() => {
    const linked = !!linkState.linked;
    const pending = !!linkState.pending;

    if (!didLoadRef.current) {
      didLoadRef.current = true;
      prevLinkedRef.current = linked;
      prevPendingRef.current = pending;
      return;
    }

    if (skipNextTransitionToastRef.current) {
      skipNextTransitionToastRef.current = false;
      prevLinkedRef.current = linked;
      prevPendingRef.current = pending;
      return;
    }

    if (!prevLinkedRef.current && linked && linkState.link?.phoneNumber) {
      toast.success(`WhatsApp connected: ${linkState.link.phoneNumber}`);
    } else if (prevLinkedRef.current && !linked) {
      toast('WhatsApp connection removed');
    } else if (!prevPendingRef.current && pending && linkState.pending?.phoneNumber) {
      toast(`Verification code sent to ${linkState.pending.phoneNumber}`);
    }

    prevLinkedRef.current = linked;
    prevPendingRef.current = pending;
  }, [linkState]);

  const startVerification = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Enter your WhatsApp number first');
      return;
    }
    setBusy(true);
    try {
      skipNextTransitionToastRef.current = true;
      const response = await fetch(`${INTEGRATIONS_API}/whatsapp/verification/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, phoneNumber }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send code');
      toast.success('Verification code sent on WhatsApp');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setBusy(false);
    }
  };

  const confirmVerification = async () => {
    if (!code.trim()) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      skipNextTransitionToastRef.current = true;
      const response = await fetch(`${INTEGRATIONS_API}/whatsapp/verification/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify code');
      setCode('');
      toast.success('WhatsApp connected to your account');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    try {
      skipNextTransitionToastRef.current = true;
      const response = await fetch(`${INTEGRATIONS_API}/whatsapp/link?entityId=${encodeURIComponent(entityId)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disconnect WhatsApp');
      setCode('');
      toast.success('WhatsApp disconnected');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect WhatsApp');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-500 shrink-0">
          <ServiceIcon id="whatsapp" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">WhatsApp</p>
            {linkState.linked && (
              <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-medium text-emerald-500">Connected</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Verify your number once, then linked users can keep talking to Agent Studio from WhatsApp.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading WhatsApp status…</p>
      ) : linkState.link ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Linked number</p>
            <p className="text-sm font-medium text-foreground mt-1">{linkState.link.phoneNumber}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Verified {new Date(linkState.link.verifiedAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void unlink()} disabled={busy}>Disconnect</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="wa-phone">Your WhatsApp number</label>
            <input
              id="wa-phone"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="491701234567"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
            />
            <p className="text-[11px] text-muted-foreground">Use international format without spaces, for example 491701234567.</p>
          </div>

          {!linkState.pending ? (
            <Button size="sm" onClick={() => void startVerification()} disabled={busy}>Send verification code</Button>
          ) : (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground">Verification pending</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Code sent to {linkState.pending.phoneNumber}. Expires {new Date(linkState.pending.expiresAt).toLocaleTimeString()}.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="wa-code">6-digit code</label>
                <input
                  id="wa-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void confirmVerification()} disabled={busy}>Confirm code</Button>
                <Button variant="outline" size="sm" onClick={() => void startVerification()} disabled={busy}>Resend</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Appearance settings ───────────────────────────────────────────────────────
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const themes = [
    { id: 'light',  label: 'Light',  icon: <Sun className="h-4 w-4" /> },
    { id: 'dark',   label: 'Dark',   icon: <Moon className="h-4 w-4" /> },
    { id: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];
  return (
    <div className="space-y-8">
      <SettingRow
        label="Theme"
        description="Choose how Agent Studio looks to you."
      >
        <div className="flex gap-2">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                theme === t.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

// ── Setting row layout ────────────────────────────────────────────────────────
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Usage log viewer ──────────────────────────────────────────────────────────
function UsageLogs({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<UsageEntry[]>(() => readUsageLog());

  const handleClear = () => {
    clearUsageLog();
    setEntries([]);
  };

  const grouped: Record<string, UsageEntry[]> = {};
  for (const e of entries) {
    const day = new Date(e.ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    (grouped[day] ??= []).push(e);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Usage Logs</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{entries.length} request{entries.length !== 1 ? 's' : ''} tracked this device</p>
        </div>
        {entries.length > 0 && (
          <button onClick={handleClear} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10">
            <Trash2 className="h-3 w-3" />Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <MessageSquare className="h-8 w-8 opacity-30" />
          <p className="text-xs">No activity yet.<br/>Start a conversation to see usage here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([day, dayEntries]) => (
            <div key={day}>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{day}</p>
              <div className="space-y-1">
                {dayEntries.map(e => (
                  <div key={e.id} className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-secondary/40 border border-border/30 hover:bg-secondary/60 transition-colors">
                    <div className="mt-0.5 shrink-0">
                      {e.type === 'canvas'
                        ? <Layout className="h-3.5 w-3.5 text-blue-400" />
                        : <MessageSquare className="h-3.5 w-3.5 text-primary/70" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground truncate leading-snug">{e.preview || '(empty)'}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="px-1 py-0.5 rounded bg-secondary/80 font-mono text-[8px]">{e.model}</span>
                        {new Date(e.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* sign out (mobile only) */}
      <div className="pt-2 sm:hidden">
        <button className="flex items-center gap-2 text-[11px] text-destructive hover:text-destructive transition-colors"
          onClick={async () => { await supabase.auth.signOut(); onClose(); }}>
          <LogOut className="h-3.5 w-3.5" />Sign Out
        </button>
      </div>
    </div>
  );
}

export function AccountPage({ onClose, initialTab = 'usage' }: AccountPageProps) {
  const [tab, setTab] = useState<AccountTab>(initialTab as AccountTab);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.getUserIdentities().then(({ data }) => {
      if (data) setIdentities(data.identities);
    });
  }, []);

  const refreshIdentities = () => {
    supabase.auth.getUserIdentities().then(({ data }) => {
      if (data) setIdentities(data.identities);
    });
  };

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  type NavItem = { id: AccountTab; label: string };
  const NAV: NavItem[] = [
    { id: 'usage',       label: 'Usage' },
    { id: 'appearance',  label: 'Appearance' },
    { id: 'account',     label: 'Account' },
    { id: 'connections', label: 'Connections' },
    { id: 'bluetooth',   label: 'Bluetooth & Home' },
    { id: 'plans',       label: 'Plans' },
  ];

  const SECTION_TITLES: Record<AccountTab, string> = {
    usage:       'Usage',
    appearance:  'Appearance',
    account:     'Account',
    connections: 'Connections',
    bluetooth:   'Bluetooth & Home',
    plans:       'Plans',
  };

  return (
    <div className="h-full flex bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="hidden sm:flex w-56 shrink-0 flex-col border-r border-border bg-card/20 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-5 pb-2">
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Back to Studio"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-base font-semibold text-foreground">Settings</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-2 pb-4 space-y-0.5">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                tab === id
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <span>{label}</span>
              {tab === id && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-3 py-3 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full shrink-0" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={async () => { await supabase.auth.signOut(); onClose(); }}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-xs">Log out</span>
          </button>
        </div>
      </div>

      {/* ── Mobile header ── */}
      <div className="sm:hidden absolute top-0 left-0 right-0 h-10 border-b border-border bg-card/80 backdrop-blur flex items-center px-3 gap-2 z-20">
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">Settings</span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto sm:pt-0 pt-10">
        {/* Mobile tab strip */}
        <div className="sm:hidden flex overflow-x-auto border-b border-border bg-card/40 sticky top-0 z-10">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="flex-1 w-full max-w-2xl mx-auto px-6 sm:px-10 py-8 sm:py-10"
          >
            <h1 className="text-xl font-semibold text-foreground mb-6">{SECTION_TITLES[tab]}</h1>

            {tab === 'usage' && <UsageLogs onClose={onClose} />}

            {tab === 'appearance' && <AppearanceTab />}

            {tab === 'account' && (
              <div>
                <p className="text-xs text-muted-foreground mb-6">Link additional providers so you can sign in with multiple accounts.</p>
                <AccountsTab identities={identities} onRefresh={refreshIdentities} />
              </div>
            )}

            {tab === 'connections' && (
              <div>
                <p className="text-xs text-muted-foreground mb-6">Connect external services so AI agents can act on your behalf.</p>
                <div className="space-y-6">
                  <WhatsAppConnectionPanel entityId={user?.id || 'anonymous'} />
                  <ConnectedAccounts entityId={user?.id || 'anonymous'} />
                </div>
              </div>
            )}

            {tab === 'bluetooth' && (
              <div className="space-y-8">
                <BluetoothTab />
                <div className="border-t border-border pt-8">
                  <SmartHomeConnections />
                </div>
              </div>
            )}

            {tab === 'plans' && (
              <PricingPlans entityId={user?.id || 'anonymous'} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
