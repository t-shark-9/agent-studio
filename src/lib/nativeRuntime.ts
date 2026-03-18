/**
 * Native runtime bridge for Tauri desktop app.
 * Provides type-safe access to native capabilities.
 * Falls back gracefully when running in browser.
 */

const isTauri = () => '__TAURI__' in window;

interface TauriInvoke {
  (cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}

function getInvoke(): TauriInvoke | null {
  if (!isTauri()) return null;
  // Tauri v2 exposes invoke on the core module
  const w = window as Record<string, unknown>;
  const tauri = w.__TAURI__ as Record<string, unknown> | undefined;
  const core = tauri?.core as Record<string, unknown> | undefined;
  return (core?.invoke as TauriInvoke) ?? null;
}

export const nativeRuntime = {
  /** True when running inside Tauri (desktop), false in browser. */
  isDesktop: isTauri(),

  /** Get the current OS platform ("macos", "windows", "linux"). */
  async getPlatform(): Promise<string> {
    const invoke = getInvoke();
    if (!invoke) return 'web';
    return (await invoke('get_platform')) as string;
  },

  /** Get the app version from Cargo.toml. */
  async getAppVersion(): Promise<string> {
    const invoke = getInvoke();
    if (!invoke) return '0.0.0';
    return (await invoke('get_app_version')) as string;
  },

  /** Open a URL in the system default browser. */
  async openExternal(url: string): Promise<void> {
    if (!isTauri()) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    const w = window as Record<string, unknown>;
    const tauri = w.__TAURI__ as Record<string, unknown> | undefined;
    const opener = tauri?.opener as Record<string, unknown> | undefined;
    const openUrl = opener?.openUrl as ((url: string) => Promise<void>) | undefined;
    if (openUrl) await openUrl(url);
  },
};
