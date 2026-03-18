<<<<<<< HEAD
/**
 * Native runtime bridge for Tauri desktop & Capacitor mobile.
 * Provides type-safe access to native capabilities.
 * Falls back gracefully when running in browser.
 */

import { Capacitor } from '@capacitor/core';

type RuntimePlatform = 'desktop' | 'ios' | 'web';

const isTauri = () => '__TAURI__' in window;
const isCapacitor = () => Capacitor.isNativePlatform();

function detectPlatform(): RuntimePlatform {
  if (isTauri()) return 'desktop';
  if (isCapacitor()) return 'ios';
  return 'web';
}

interface TauriInvoke {
  (cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}

function getInvoke(): TauriInvoke | null {
  if (!isTauri()) return null;
  const w = window as Record<string, unknown>;
  const tauri = w.__TAURI__ as Record<string, unknown> | undefined;
  const core = tauri?.core as Record<string, unknown> | undefined;
  return (core?.invoke as TauriInvoke) ?? null;
}

export const nativeRuntime = {
  /** Current platform: 'desktop' (Tauri), 'ios' (Capacitor), or 'web' (browser). */
  platform: detectPlatform(),

  /** True when running inside Tauri (desktop). */
  isDesktop: isTauri(),

  /** True when running inside Capacitor (iOS). */
  isMobile: isCapacitor(),

  /** True when running in plain browser. */
  isWeb: !isTauri() && !isCapacitor(),

  /** Whether the runtime supports local terminal/shell access. */
  hasTerminal: isTauri(),

  /** Get the current OS platform string. */
  async getPlatform(): Promise<string> {
    if (isTauri()) {
      const invoke = getInvoke();
      if (invoke) return (await invoke('get_platform')) as string;
    }
    if (isCapacitor()) return Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
    return 'web';
  },

  /** Get the app version. */
  async getAppVersion(): Promise<string> {
    const invoke = getInvoke();
    if (!invoke) return '0.0.0';
    return (await invoke('get_app_version')) as string;
  },

  /** Open a URL in the system default browser. */
  async openExternal(url: string): Promise<void> {
    if (isTauri()) {
      const w = window as Record<string, unknown>;
      const tauri = w.__TAURI__ as Record<string, unknown> | undefined;
      const opener = tauri?.opener as Record<string, unknown> | undefined;
      const openUrl = opener?.openUrl as ((url: string) => Promise<void>) | undefined;
      if (openUrl) await openUrl(url);
      return;
    }
    // Capacitor and web: both use window.open
    window.open(url, '_blank', 'noopener');
  },

  /** Trigger haptic feedback on mobile. No-op on desktop/web. */
  async haptic(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!isCapacitor()) return;
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  },
};
=======
export type DesktopCommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

const isWindowDefined = typeof window !== 'undefined';

export function isTauriDesktop(): boolean {
  return isWindowDefined && '__TAURI_INTERNALS__' in window;
}

export async function runDesktopCommand(command: string, args: string[] = []): Promise<DesktopCommandResult> {
  if (!isTauriDesktop()) {
    throw new Error('Desktop command execution is only available in the downloadable desktop app.');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<DesktopCommandResult>('run_terminal_command', { command, args });
}
>>>>>>> origin/main
