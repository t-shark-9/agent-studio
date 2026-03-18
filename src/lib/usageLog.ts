const KEY = 'agent-studio.usage-log.v1';
const MAX = 500;

export interface UsageEntry {
  id: string;
  ts: number;
  type: 'chat' | 'canvas';
  model: string;
  preview: string;
}

export function appendUsageLog(entry: Omit<UsageEntry, 'id' | 'ts'>) {
  try {
    const existing = readUsageLog();
    const next: UsageEntry = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      ...entry,
    };
    const trimmed = [next, ...existing].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch { /* quota / SSR */ }
}

export function readUsageLog(): UsageEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as UsageEntry[];
  } catch {
    return [];
  }
}

export function clearUsageLog() {
  localStorage.removeItem(KEY);
}
