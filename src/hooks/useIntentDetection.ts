import type { ContextType, IntentDetection } from '@/types/chat';

const INTENT_PATTERNS: { pattern: RegExp; type: ContextType; entities?: string[] }[] = [
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
