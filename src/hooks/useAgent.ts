import { useCallback, useRef } from 'react';
import type { ContextType } from '@/types/chat';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
}

export interface AgentResponse {
  type: 'text' | 'canvas';
  content: string;
  canvas?: CanvasData;
}

interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (response: AgentResponse) => void;
  onError?: (error: Error) => void;
  onCanvasStart?: (canvas: CanvasData) => void;
}

const CANVAS_SYSTEM_PROMPT = `You are Agent Studio, an AI assistant that creates rich visual experiences instead of plain text responses.

When a user asks you to DO something (book a restaurant, plan a trip, shop for products, build a website, compare options, fill out a form, etc.), you MUST respond with a visual interactive UI instead of text.

To create a visual experience, wrap your HTML in a <canvas-ui> tag like this:

<canvas-ui title="Restaurant Booking" type="restaurant-booking">
<!-- Your full HTML here with inline CSS and JS -->
</canvas-ui>

RULES FOR CANVAS UIs:
1. Use modern, beautiful CSS (gradients, shadows, rounded corners, animations)
2. Use a dark theme: background #1a1a2e, cards #16213e, accent #e94560, text #eee
3. Make it INTERACTIVE — buttons, selectors, cards that respond to clicks
4. Include inline JavaScript for interactivity
5. When the user makes a selection or takes action, call: canvasAction('action_name', { ...data })
   This function is automatically available — it sends the action back to Agent Studio
6. NEVER use external CDNs or scripts — everything must be inline
7. Make it mobile-responsive
8. The UI should feel like a native app, not a website

WHEN TO USE CANVAS UI:
- Restaurant booking → show restaurant cards with photos, date/time pickers, guest counter
- Travel planning → show destination cards, flight options, maps, itinerary builder
- Shopping → show product cards with images, prices, add-to-cart
- Website building → show a live preview + code editor
- Comparing options → show side-by-side comparison cards
- Any form → show a beautiful multi-step form
- Data/charts → show interactive visualizations

WHEN TO USE PLAIN TEXT:
- Simple questions ("what time is it?", "who are you?")
- Explanations and conversations
- When the user explicitly asks for text

IMPORTANT: The canvas-ui content should be COMPLETE, standalone HTML. Include ALL styles inline. Make it beautiful and functional.`;

export function useAgent() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSystemPrompt = (contextType: ContextType): string => {
    const contextHints: Record<ContextType, string> = {
      chat: '',
      trip: '\nThe user is in TRIP PLANNING mode. Prioritize visual travel experiences.',
      booking: '\nThe user is in RESTAURANT BOOKING mode. Show restaurant options visually.',
      media: '\nThe user is in MEDIA CREATION mode. Show media creation tools visually.',
    };
    return CANVAS_SYSTEM_PROMPT + (contextHints[contextType] || '');
  };

  const createCanvas = async (html: string, title: string, type: string): Promise<CanvasData | null> => {
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, title, type, sessionId: 'agent-studio' }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: data.canvasId,
        url: data.url,
        embedUrl: data.embedUrl,
        title,
      };
    } catch {
      return null;
    }
  };

  const updateCanvas = async (canvasId: string, html: string): Promise<void> => {
    try {
      await fetch(`${CANVAS_URL}/api/canvas/${canvasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
    } catch {
      // Silent — best effort live update
    }
  };

  const streamResponse = useCallback(async (
    userMessage: string,
    contextType: ContextType,
    model: string,
    history: Message[] = [],
    callbacks?: StreamCallbacks
  ): Promise<AgentResponse> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const messages: Message[] = [
      { role: 'system', content: getSystemPrompt(contextType) },
      ...history,
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      // Live canvas streaming state
      let liveCanvasId: string | null = null;
      let liveCanvas: CanvasData | null = null;
      let canvasTagOpened = false;
      let canvasTitle = '';
      let canvasType = '';
      let lastUpdateLen = 0;
      let updateTimer: ReturnType<typeof setTimeout> | null = null;

      const flushCanvasUpdate = () => {
        if (!liveCanvasId || !canvasTagOpened) return;
        // Extract HTML content after the opening tag
        const tagEnd = fullResponse.indexOf('>', fullResponse.indexOf('<canvas-ui'));
        if (tagEnd < 0) return;
        const htmlSoFar = fullResponse.slice(tagEnd + 1).replace(/<\/canvas-ui>[\s\S]*$/, '');
        if (htmlSoFar.length > lastUpdateLen + 50) {
          lastUpdateLen = htmlSoFar.length;
          updateCanvas(liveCanvasId, htmlSoFar);
        }
      };

      const scheduleUpdate = () => {
        if (updateTimer) return;
        updateTimer = setTimeout(() => {
          updateTimer = null;
          flushCanvasUpdate();
        }, 120); // throttle to ~8fps
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                callbacks?.onChunk?.(content);

                // Detect canvas-ui opening tag — create canvas immediately
                if (!canvasTagOpened && fullResponse.includes('<canvas-ui')) {
                  const match = fullResponse.match(/<canvas-ui\s+title="([^"]*)"(?:\s+type="([^"]*)")?\s*>/);
                  if (match) {
                    canvasTagOpened = true;
                    canvasTitle = match[1];
                    canvasType = match[2] || 'generic';
                    // Create canvas with loading placeholder
                    const loadingHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#eee;font-family:system-ui,sans-serif"><div style="text-align:center"><div style="width:40px;height:40px;border:3px solid #2a2a4a;border-top-color:#e94560;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px"></div><p style="font-size:14px;color:#888">Building your experience...</p></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style></div>`;
                    liveCanvas = await createCanvas(loadingHtml, canvasTitle, canvasType);
                    if (liveCanvas) {
                      liveCanvasId = liveCanvas.id;
                      callbacks?.onCanvasStart?.(liveCanvas);
                    }
                  }
                }

                // Live-update the canvas as HTML streams in
                if (canvasTagOpened && liveCanvasId) {
                  scheduleUpdate();
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Clear any pending timer
      if (updateTimer) {
        clearTimeout(updateTimer);
        updateTimer = null;
      }

      // Check for canvas UI in the final response
      const canvasMatch = fullResponse.match(
        /<canvas-ui\s+title="([^"]*)"(?:\s+type="([^"]*)")?\s*>([\s\S]*?)<\/canvas-ui>/
      );

      if (canvasMatch) {
        const [, title, type, html] = canvasMatch;
        const finalHtml = html.trim();

        // If we already have a live canvas, just do a final update
        if (liveCanvas && liveCanvasId) {
          await updateCanvas(liveCanvasId, finalHtml);
        } else {
          // Fallback: create canvas now (shouldn't normally happen)
          liveCanvas = await createCanvas(finalHtml, title, type || 'generic');
        }

        const textBefore = fullResponse.substring(0, fullResponse.indexOf('<canvas-ui')).trim();
        const textAfter = fullResponse.substring(fullResponse.indexOf('</canvas-ui>') + '</canvas-ui>'.length).trim();
        const text = [textBefore, textAfter].filter(Boolean).join('\n\n') || `Here's your ${title}:`;

        const result: AgentResponse = { type: 'canvas', content: text, canvas: liveCanvas || undefined };
        callbacks?.onComplete?.(result);
        return result;
      }

      const result: AgentResponse = { type: 'text', content: fullResponse };
      callbacks?.onComplete?.(result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { type: 'text', content: '' };
      }
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      throw err;
    }
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const getResponse = useCallback(async (
    message: string,
    contextType: ContextType,
    model: string,
    history: Message[] = [],
    onCanvasStart?: (canvas: CanvasData) => void
  ): Promise<AgentResponse> => {
    return streamResponse(message, contextType, model, history, { onCanvasStart });
  }, [streamResponse]);

  return { getResponse, streamResponse, abort };
}
