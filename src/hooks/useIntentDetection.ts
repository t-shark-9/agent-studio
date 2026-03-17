import type { ContextType, IntentDetection } from '@/types/chat';

const INTENT_PATTERNS: { pattern: RegExp; type: ContextType; entities?: string[] }[] = [
  { pattern: /\b(watch|play)\b.*(video|youtube|movie|clip|stream)/i, type: 'browse' },
  { pattern: /\b(search|look\s*up|google|find)\b.*(on\s*the\s*(web|internet)|online)/i, type: 'browse' },
  { pattern: /\b(open|go\s*to|visit|navigate|browse)\b.*(website|site|page|\.com|\.org|\.io|youtube|google|reddit|wikipedia)/i, type: 'browse' },
  { pattern: /\b(youtube\.com|google\.com|reddit\.com|wikipedia\.org|twitter\.com|x\.com|github\.com)/i, type: 'browse' },
  { pattern: /\b(docs\.google\.com|sheets\.google\.com|drive\.google\.com|overleaf\.com)/i, type: 'browse' },
  { pattern: /\b(edit|open|modify)\b.*(google\s*(doc|sheet|slide|drive)|spreadsheet|document)\b/i, type: 'browse' },
  { pattern: /\bhttps?:\/\//i, type: 'browse' },
  { pattern: /\b(plan|trip|travel|visit|itinerary|flight|hotel|vacation|holiday)\b.*(to|in|at)\s+(\w+)/i, type: 'trip' },
  { pattern: /\b(book|reserve|reservation|restaurant|table|dining|eat)\b/i, type: 'booking' },
  { pattern: /\b(create|generate|make|design)\b.*(image|photo|picture|video|animation|media|art|illustration)\b/i, type: 'media' },
  { pattern: /\b(image|photo|picture|video|animation)\b.*(of|about|with|showing)\b/i, type: 'media' },
];

export function detectIntent(message: string): IntentDetection | null {
  for (const { pattern, type } of INTENT_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const entities: Record<string, string> = {};
      if (type === 'trip' && match[3]) {
        entities.destination = match[3];
      }
      return { type, confidence: 0.8, entities };
    }
  }
  return null;
}

export function useIntentDetection() {
  return { detectIntent };
}
