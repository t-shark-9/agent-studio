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

export interface EditResponse {
  content: string;
  patch: string;
  label: string;
  description: string;
}

interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (response: AgentResponse) => void;
  onError?: (error: Error) => void;
  onCanvasStart?: (canvas: CanvasData) => void;
}

const BROWSER_API = '/browser';

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

WHEN TO USE BROWSER CANVAS:
When the user wants to browse the web, watch videos, visit websites, or do anything that requires the internet:

**YouTube videos**: Create a canvas with an embedded YouTube player. Extract the video ID and use:
<iframe src="https://www.youtube.com/embed/VIDEO_ID" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
If the user doesn't specify a video, show a YouTube search/browse interface with popular categories.

**Web browsing / searching**: Create a browser-like canvas with:
- A URL/search bar at the top
- Navigation buttons (back, forward, refresh)
- The main content area showing results or a landing page
- Use JavaScript fetch to call the browser API: POST /browser/browse with { url: "..." }
- The API returns { screenshot, metadata: { title, links } }
- Display the screenshot as the page content, show clickable links

**Browser canvas pattern**:
<canvas-ui title="Browser" type="browse">
<div style="display:flex;flex-direction:column;height:100vh;background:#1a1a2e;font-family:system-ui,sans-serif">
  <!-- Browser chrome bar -->
  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#0f0f23;border-bottom:1px solid #2a2a4a">
    <button onclick="browserBack()" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer">←</button>
    <button onclick="browserForward()" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer">→</button>
    <input id="url-bar" type="text" value="URL" style="flex:1;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:20px;padding:6px 14px;color:#eee;font-size:13px;outline:none"
      onkeydown="if(event.key==='Enter')navigateTo(this.value)">
    <button onclick="navigateTo(document.getElementById('url-bar').value)" style="background:#e94560;border:none;border-radius:16px;padding:6px 14px;color:#fff;font-size:12px;cursor:pointer">Go</button>
  </div>
  <!-- Content area -->
  <div id="browser-content" style="flex:1;overflow:auto;padding:0">
    <!-- Page content goes here -->
  </div>
</div>
<script>
let browseSessionId = null;
async function navigateTo(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  document.getElementById('url-bar').value = url;
  document.getElementById('browser-content').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888"><div style="text-align:center"><div style="width:30px;height:30px;border:3px solid #2a2a4a;border-top-color:#e94560;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px"></div><p style="font-size:13px">Loading...</p></div></div>';
  try {
    const res = await fetch('/browser/browse', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ url, sessionId: browseSessionId }) });
    const data = await res.json();
    if (data.success) {
      browseSessionId = data.sessionId;
      document.getElementById('url-bar').value = data.metadata.url;
      document.getElementById('browser-content').innerHTML = '<img src="' + data.screenshot + '" style="width:100%;display:block">';
    }
  } catch(e) { document.getElementById('browser-content').innerHTML = '<p style="color:#e94560;padding:20px">Failed to load page</p>'; }
}
async function browserBack() {
  if (!browseSessionId) return;
  const res = await fetch('/browser/browse/interact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sessionId: browseSessionId, action: 'back' }) });
  const data = await res.json();
  if (data.success) {
    document.getElementById('url-bar').value = data.url;
    document.getElementById('browser-content').innerHTML = '<img src="' + data.screenshot + '" style="width:100%;display:block">';
  }
}
async function browserForward() {
  if (!browseSessionId) return;
  const res = await fetch('/browser/browse/interact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sessionId: browseSessionId, action: 'forward' }) });
  const data = await res.json();
  if (data.success) {
    document.getElementById('url-bar').value = data.url;
    document.getElementById('browser-content').innerHTML = '<img src="' + data.screenshot + '" style="width:100%;display:block">';
  }
}
</script>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
</canvas-ui>

For YouTube, embed the video DIRECTLY instead of using screenshots. For other sites, use the browser API pattern above.
If the user says "search for X" without specifying a site, use Google: navigateTo('https://www.google.com/search?q=' + encodeURIComponent(query))

WHEN THE USER ASKS A QUESTION (knowledge, explanation, how-to, facts, comparisons, etc.):
ALWAYS respond with a beautiful visual canvas — NEVER plain text. Present the answer as:
- Infographic-style layout with icons, sections, and color-coded cards
- Timeline for historical questions
- Comparison tables for "what's the difference" questions
- Step-by-step visual guides for how-to questions
- Stat cards with large numbers for factual/data questions
- Diagram-style layouts for "how does X work" questions
- Map-style layouts for geography questions
- Profile cards for "who is" questions

Example: "What's the capital of France?" → a beautiful card showing Paris with key facts, a stylized map outline, population stats, famous landmarks as image placeholders, and a color theme matching the French flag.

Example: "How does photosynthesis work?" → a step-by-step visual diagram with numbered stages, arrows between them, color-coded molecules (CO2, H2O, glucose), and animated transitions.

Example: "Compare Python vs JavaScript" → side-by-side comparison cards with category rows (speed, syntax, use cases, ecosystem), color-coded strengths/weaknesses, and a verdict section.

The goal is to make EVERY response feel like a premium visual experience. Think of it as an interactive infographic, not a text response.

WHEN TO USE PLAIN TEXT (rare):
- Only for very short confirmations ("Done", "Got it")
- When the user explicitly says "just text" or "no UI"

IMPORTANT: The canvas-ui content should be COMPLETE, standalone HTML. Include ALL styles inline. Make it beautiful and functional. Default to visual canvas for EVERYTHING.`;

export function useAgent() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSystemPrompt = (contextType: ContextType): string => {
    const contextHints: Record<ContextType, string> = {
      chat: '',
      trip: '\nThe user is in TRIP PLANNING mode. Prioritize visual travel experiences.',
      booking: '\nThe user is in RESTAURANT BOOKING mode. Show restaurant options visually.',
      media: '\nThe user is in MEDIA CREATION mode. Show media creation tools visually.',
      browse: '\nThe user wants to BROWSE THE WEB. Create a browser canvas with navigation. For YouTube, embed the video directly. For other sites, use the /browser/browse API to screenshot and display pages.',
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

  const streamEdit = useCallback(async (
    userMessage: string,
    currentHtml: string,
    canvasId: string,
    model: string,
    history: Message[] = [],
    callbacks?: { onChunk?: (chunk: string) => void }
  ): Promise<EditResponse> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Fetch current HTML from canvas server if not provided
    let html = currentHtml;
    if (!html) {
      try {
        const srcRes = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/source`);
        if (srcRes.ok) {
          const data = await srcRes.json();
          html = data.html || '';
        }
      } catch { /* proceed with empty */ }
    }

    const editSystemPrompt = `You are editing an existing interactive UI canvas. The user wants to modify the current experience.

CURRENT CANVAS HTML:
---
${html}
---

OUTPUT FORMAT:
Wrap your changes in a <canvas-patch> tag with a label and description attribute:

<canvas-patch label="Short Name" description="What this change does">
<!-- Your patch: CSS, JS, and/or HTML -->
</canvas-patch>

After the patch block, write a brief message to the user explaining what you changed.

PATCH RULES:
1. Your patch gets INJECTED before </body> in the existing HTML — it must be self-contained
2. Use <style> blocks to add or override CSS (use specific selectors, !important if needed)
3. Use <script> blocks wrapped in an IIFE to modify existing DOM or add behavior
4. Add new HTML elements if needed (they appear at the bottom of the page by default — use CSS position to place them)
5. To hide existing elements: .selector { display: none !important; }
6. To modify existing text/content: use JS with document.querySelector
7. Keep patches independent — each patch should work on its own
8. NEVER reproduce the entire page. Output ONLY the additive patch.
9. Patches should be small and focused on the user's request
10. When adding interactive elements, use canvasAction('action_name', { ...data }) for callbacks`;

    const messages: Message[] = [
      { role: 'system', content: editSystemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                callbacks?.onChunk?.(content);
              }
            } catch { /* ignore */ }
          }
        }
      }

      // Extract the patch
      const patchMatch = fullResponse.match(
        /<canvas-patch\s+label="([^"]*)"(?:\s+description="([^"]*)")?\s*>([\s\S]*?)<\/canvas-patch>/
      );

      if (patchMatch) {
        const [, label, description, patch] = patchMatch;
        const trimmedPatch = patch.trim();

        // Apply patch to canvas immediately
        const srcRes = await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/source`);
        if (srcRes.ok) {
          const { html } = await srcRes.json();
          const insertPoint = html.lastIndexOf('</body>');
          const newHtml = insertPoint >= 0
            ? html.slice(0, insertPoint) + trimmedPatch + html.slice(insertPoint)
            : html + trimmedPatch;
          await updateCanvas(canvasId, newHtml);
        }

        // Create a setting on the canvas server
        await fetch(`${CANVAS_URL}/api/canvas/${canvasId}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `edit-${Date.now()}`,
            label,
            description: description || '',
            htmlPatch: trimmedPatch,
            enabled: true,
          }),
        });

        const textParts = fullResponse
          .replace(/<canvas-patch[\s\S]*?<\/canvas-patch>/, '')
          .trim();

        return {
          content: textParts || `Applied: ${label}`,
          patch: trimmedPatch,
          label,
          description: description || '',
        };
      }

      // No patch found — return as plain text
      return { content: fullResponse, patch: '', label: '', description: '' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { content: '', patch: '', label: '', description: '' };
      }
      throw error;
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

  return { getResponse, streamResponse, streamEdit, abort };
}
