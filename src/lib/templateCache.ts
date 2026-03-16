const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';
const LS_KEY = 'agent_studio_templates';

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  color?: string;
  html: string;
  settings?: { key: string; label: string }[];
  createdAt: number;
}

let _cache: TemplateData[] = [];
let _fetchPromise: Promise<TemplateData[]> | null = null;

// Load from localStorage synchronously on module init
try {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) _cache = JSON.parse(stored);
} catch { /* ignore */ }

function fetchTemplates(): Promise<TemplateData[]> {
  if (!_fetchPromise) {
    _fetchPromise = fetch(`${CANVAS_URL}/api/templates`)
      .then(r => r.ok ? r.json() : [])
      .then((data: TemplateData[]) => {
        _cache = data;
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
        return data;
      })
      .catch(() => _cache);
  }
  return _fetchPromise;
}

// Start fetching immediately on module load
fetchTemplates();

/** Get cached templates synchronously (instant, may be stale) */
export function getCachedTemplates(): TemplateData[] {
  return _cache;
}

/** Get template by ID from cache */
export function getCachedTemplate(id: string): TemplateData | undefined {
  return _cache.find(t => t.id === id);
}

/** Get fresh templates */
export function getTemplates(): Promise<TemplateData[]> {
  return fetchTemplates();
}

/** Force re-fetch */
export function refreshTemplates(): Promise<TemplateData[]> {
  _fetchPromise = null;
  return fetchTemplates();
}
