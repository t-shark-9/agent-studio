import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Code2, Sparkles, Settings, Cpu, Link2 } from 'lucide-react';
import { AGENT_MODELS } from '@/components/StatusBar';
import { TaskRail } from '@/components/TaskRail';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanvasEmbed } from '@/components/CanvasEmbed';
import { BrowserView } from '@/components/BrowserView';
import { CodeView } from '@/components/CodeView';
import { CanvasSettings } from '@/components/CanvasSettings';
import { ConnectedAccounts } from '@/components/ConnectedAccounts';
import { FloatingChat } from '@/components/FloatingChat';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthModal } from '@/components/AuthModal';
import { refreshTemplateCache } from '@/components/CanvasHome';
import { getCachedTemplate } from '@/lib/templateCache';
import { useSessionManager } from '@/hooks/useSessionManager';
import { detectIntent } from '@/hooks/useIntentDetection';
import { useAgent } from '@/hooks/useAgent';
import type { ContextType } from '@/types/chat';
import type { AttachedFile } from '@/components/MessageComposer';

type OverlayMode = 'none' | 'chat' | 'code' | 'settings' | 'connections';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
  templateId?: string;
}

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4.6');
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null);
  const [activeHtml, setActiveHtml] = useState<string | null>(null);
  const [streamingHtml, setStreamingHtml] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);

  const {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    setIsLoading,
    setActiveSessionId,
    createSession,
    addMessage,
    updateMessageMeta,
    updateSessionContext,
    deleteSession,
    setMessages,
  } = useSessionManager();

  const { streamResponse, streamEdit } = useAgent();
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Show welcome content when no active session
  const showWelcome = !activeSessionId && messages.length === 0 && !activeCanvas && !browserUrl;

  // Canvas restore: only runs when explicitly switching to an existing session via sidebar
  const [restoreSessionId, setRestoreSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!restoreSessionId || restoreSessionId !== activeSessionId) return;
    if (!messages.length) return; // Messages still loading from Supabase

    setRestoreSessionId(null);
    for (let i = messages.length - 1; i >= 0; i--) {
      const meta = messages[i].metadata as Record<string, unknown> | undefined;
      const canvas = meta?.canvas as CanvasData | undefined;
      if (canvas?.id) {
        setActiveCanvas(canvas);
        setRailCollapsed(false);
        return;
      }
    }
    // Session has messages but no canvas — that's fine
  }, [restoreSessionId, activeSessionId, messages]);

  // Listen for postMessage from canvas iframes — just log, don't call AI
  // Canvas buttons already have their own JS handlers
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'canvas-action') {
        console.log('[Canvas Action]', e.data.action, e.data.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const extractTemplate = useCallback(async (canvasId: string) => {
    try {
      const res = await fetch(`${CANVAS_URL}/api/templates/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasId }),
      });
      if (res.ok) refreshTemplateCache();
    } catch {
      // Silent
    }
  }, []);

  const handleSend = useCallback(async (content: string, files?: AttachedFile[]) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    const metadata: Record<string, unknown> = {};
    if (files && files.length > 0) {
      metadata.files = files.map(f => ({
        name: f.file.name,
        size: f.file.size,
        type: f.file.type,
        url: f.preview || undefined,
      }));
    }

    let fullContent = content;
    if (files && files.length > 0) {
      const fileDescs = files.map(f => {
        const desc = `[Attached: ${f.file.name} (${f.file.type}, ${(f.file.size / 1024).toFixed(0)}KB)]`;
        // Include the actual data URL for images so the AI can use it in file processing APIs
        if (f.preview && f.file.type.startsWith('image/')) {
          return `${desc}\n[File data URL: ${f.preview}]`;
        }
        return desc;
      });
      fullContent = fileDescs.join('\n') + (content ? '\n' + content : '');
    }

    await addMessage('user', fullContent, Object.keys(metadata).length > 0 ? metadata : undefined, currentSessionId);

    const intent = detectIntent(content);
    let contextType: ContextType = activeSession?.context_type as ContextType || 'chat';

    if (intent) {
      contextType = intent.type;
      await updateSessionContext(currentSessionId, intent.type,
        intent.type === 'trip' ? `Trip${intent.entities?.destination ? ` to ${intent.entities.destination}` : ''}` :
        intent.type === 'booking' ? 'Restaurant Booking' :
        intent.type === 'media' ? 'Media Creation' :
        intent.type === 'browse' ? 'Browsing' : 'Chat'
      );

      // For browse intent, show the BrowserView immediately
      if (intent.type === 'browse') {
        // Extract URL from message if present, otherwise detect site
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        const siteMatch = content.match(/\b(youtube|google|reddit|github|twitter|wikipedia|x)\.com\b/i) ||
                          content.match(/\b(youtube|google|reddit|github|twitter|wikipedia)\b/i);
        let browseTarget = urlMatch?.[0] || null;
        if (!browseTarget && siteMatch) {
          const site = siteMatch[1].toLowerCase();
          browseTarget = `https://www.${site}.com`;
        }
        if (!browseTarget && /\b(search|look\s*up|google|find)\b/i.test(content)) {
          // Extract the search query
          const query = content.replace(/\b(search|look\s*up|google|find|for|on the web|on the internet|online)\b/gi, '').trim();
          if (query) browseTarget = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        if (!browseTarget && /\byoutube\b/i.test(content)) {
          browseTarget = 'https://www.youtube.com';
        }
        setBrowserUrl(browseTarget || 'https://www.google.com');
        setActiveCanvas(null);
        setActiveHtml(null);
        setRailCollapsed(false);
        await addMessage('assistant', `Opening browser${browseTarget ? `: ${browseTarget}` : ''}`, undefined, currentSessionId);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setStreamingHtml(null);
    let fullStream = '';
    try {
      const response = await streamResponse(
        fullContent,
        contextType,
        selectedModel,
        [],
        {
          onCanvasStart: (canvas) => {
            setActiveCanvas(canvas);
            setActiveHtml(null);
            setRailCollapsed(false);
            setOverlayMode('code');
          },
          onChunk: (chunk) => {
            fullStream += chunk;
            // Extract HTML inside <canvas-ui> for the code panel
            const tagEnd = fullStream.indexOf('>', fullStream.indexOf('<canvas-ui'));
            if (tagEnd >= 0) {
              const htmlSoFar = fullStream.slice(tagEnd + 1).replace(/<\/canvas-ui>[\s\S]*$/, '');
              setStreamingHtml(htmlSoFar);
            }
          },
        }
      );

      setStreamingHtml(null);
      if (response.type === 'canvas' && response.canvas) {
        await addMessage('assistant', response.content, { canvas: response.canvas }, currentSessionId);
        setActiveCanvas(response.canvas);
        setActiveHtml(null);
        setRailCollapsed(false);
        extractTemplate(response.canvas.id);
      } else {
        await addMessage('assistant', response.content, undefined, currentSessionId);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong. Please try again.', undefined, currentSessionId);
      setStreamingHtml(null);
    }
    setIsLoading(false);
  }, [activeSessionId, activeSession, addMessage, createSession, streamResponse, setIsLoading, updateSessionContext, selectedModel, extractTemplate]);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    const tpl = getCachedTemplate(templateId);
    if (!tpl) return;

    // Show instantly via srcdoc — no server round trip
    setActiveHtml(tpl.html);
    setActiveCanvas({ id: '', url: '', embedUrl: '', title: tpl.name, templateId });
    setRailCollapsed(false);

    // Create session + register canvas with server in the background
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    await addMessage('user', `Use template: ${tpl.name}`, undefined, currentSessionId);
    const assistantMsg = await addMessage('assistant', `Here's your ${tpl.name}. You can interact with it or ask me to make changes.`, undefined, currentSessionId);

    // Register with canvas server in background (enables SSE live updates + code editing)
    try {
      const res = await fetch(`${CANVAS_URL}/api/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: tpl.html, title: tpl.name, type: tpl.category, sessionId: 'agent-studio' }),
      });
      if (res.ok) {
        const data = await res.json();
        const canvas: CanvasData = {
          id: data.canvasId,
          url: data.url,
          embedUrl: data.embedUrl,
          title: tpl.name,
          templateId,
        };
        setActiveCanvas(canvas);
        setActiveHtml(null); // switch to server-backed iframe
        // Save canvas metadata so session restore works when switching back
        if (assistantMsg) {
          updateMessageMeta(assistantMsg.id, { canvas });
        }
      }
    } catch {
      // Keep showing srcdoc version — still works fine
    }
  }, [activeSessionId, createSession, addMessage, updateMessageMeta]);

  // Canvas actions are handled by the canvas's own JS — no AI call needed
  const handleCanvasAction = useCallback((_action: string, _payload: Record<string, unknown>) => {
    // Intentionally no-op: canvas handles its own interactions
  }, []);

  // Edit the current canvas — used by overlay chat (doesn't create a new canvas)
  const handleEditSend = useCallback(async (content: string) => {
    if (!activeCanvas) return;

    // If canvas has no server-side id yet (srcdoc template), register it first
    let canvasId = activeCanvas.id;
    if (!canvasId && activeHtml) {
      try {
        const res = await fetch(`${CANVAS_URL}/api/canvas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: activeHtml, title: activeCanvas.title, type: 'generic', sessionId: 'agent-studio' }),
        });
        if (res.ok) {
          const data = await res.json();
          canvasId = data.canvasId;
          setActiveCanvas(prev => prev ? { ...prev, id: canvasId, url: data.url, embedUrl: data.embedUrl } : prev);
          setActiveHtml(null); // Switch to server-backed iframe
        }
      } catch {
        // Can't register — bail
      }
    }
    if (!canvasId) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    await addMessage('user', content, undefined, currentSessionId);
    setIsLoading(true);
    setStreamingHtml(null);
    setOverlayMode('code'); // Show code panel while editing

    let fullStream = '';
    try {
      const result = await streamEdit(
        content,
        '', // currentHtml is fetched inside streamEdit from canvas server
        canvasId,
        selectedModel,
        [],
        {
          onChunk: (chunk) => {
            fullStream += chunk;
            // Extract content inside <canvas-patch> for the code panel
            const patchStart = fullStream.indexOf('<canvas-patch');
            if (patchStart >= 0) {
              const tagEnd = fullStream.indexOf('>', patchStart);
              if (tagEnd >= 0) {
                const patchSoFar = fullStream.slice(tagEnd + 1).replace(/<\/canvas-patch>[\s\S]*$/, '');
                setStreamingHtml(patchSoFar);
              }
            }
          },
        }
      );

      setStreamingHtml(null);

      if (result.patch) {
        await addMessage('assistant', result.content, { edit: { label: result.label, description: result.description } }, currentSessionId);
        setSettingsVersion(v => v + 1); // Trigger settings panel refresh
      } else {
        await addMessage('assistant', result.content, undefined, currentSessionId);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong with the edit.', undefined, currentSessionId);
      setStreamingHtml(null);
    }
    setIsLoading(false);
  }, [activeCanvas, activeHtml, activeSessionId, addMessage, createSession, streamEdit, setIsLoading, selectedModel]);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setActiveCanvas(null);
    setActiveHtml(null);
    setStreamingHtml(null);
    setBrowserUrl(null);
    setOverlayMode('none');
  }, [setActiveSessionId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setActiveCanvas(null);
    setActiveHtml(null);
    setBrowserUrl(null);
    setMessages([]);
    setOverlayMode('none');
    setRestoreSessionId(id); // Trigger canvas restore after messages load
  }, [setActiveSessionId, setMessages]);

  const toggleOverlay = useCallback((mode: OverlayMode) => {
    setOverlayMode(prev => prev === mode ? 'none' : mode);
  }, []);

  return (
    <div className="h-screen flex bg-background overflow-hidden safe-area-top safe-area-bottom">
        <TaskRail
          sessions={sessions}
          activeSessionId={activeSessionId}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed(c => !c)}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={deleteSession}
          onAuthClick={() => setShowAuth(true)}
        />

        {/* Main content — single unified area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Canvas/Browser title bar */}
          {(activeCanvas || browserUrl) && (
            <div className="h-10 border-b border-border flex items-center px-3 gap-1 shrink-0 bg-card/50 z-10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="font-medium">{browserUrl ? 'Browser' : activeCanvas?.title}</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => toggleOverlay('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'chat'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </button>
                <button
                  onClick={() => toggleOverlay('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'code'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Code
                </button>
                <button
                  onClick={() => toggleOverlay('settings')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'settings'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                <button
                  onClick={() => toggleOverlay('connections')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    overlayMode === 'connections'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect
                </button>
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 min-h-0 relative">
            {/* Background layer: welcome content or canvas */}
            <AnimatePresence mode="wait">
              {showWelcome && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <WelcomeScreen
                    onSend={handleSend}
                    onUseTemplate={handleUseTemplate}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </motion.div>
              )}

              {activeCanvas && !browserUrl && (
                <motion.div
                  key={`canvas-${activeCanvas.id || 'srcdoc'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <CanvasEmbed
                    canvasId={activeCanvas.id || undefined}
                    html={activeHtml || undefined}
                    onCanvasAction={handleCanvasAction}
                  />
                </motion.div>
              )}

              {browserUrl && (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <BrowserView
                    initialUrl={browserUrl}
                    onNavigate={(url, title) => {
                      console.log('[Browser]', title, url);
                    }}
                  />
                </motion.div>
              )}

              {!showWelcome && !activeCanvas && !browserUrl && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 animate-pulse text-primary/40" />
                    <p className="text-sm">Working on it...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat/Code overlay panel */}
            <AnimatePresence>
              {overlayMode !== 'none' && (activeCanvas || browserUrl) && (
                <motion.div
                  key={overlayMode}
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-y-0 right-0 w-[400px] max-w-[80%] bg-card border-l border-border shadow-xl z-20 flex flex-col"
                >
                  {overlayMode === 'chat' && (
                    <>
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">Chat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-6 w-auto min-w-[120px] border-border bg-secondary text-[11px] px-2 py-0">
                              <SelectValue>
                                {AGENT_MODELS.find(m => m.id === selectedModel)?.label || selectedModel}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {AGENT_MODELS.map(model => (
                                <SelectItem key={model.id} value={model.id} className="text-xs">
                                  <span className="font-medium">{model.label}</span>
                                  <span className="text-muted-foreground ml-1">({model.provider})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                        {messages.map(msg => {
                          const isUser = msg.role === 'user';
                          return (
                            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                                isUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-foreground'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground animate-pulse">
                              Thinking...
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 border-t border-border p-2">
                        <div className="flex gap-2 items-end">
                          <textarea
                            placeholder="Edit this canvas..."
                            className="flex-1 resize-none rounded-lg bg-secondary border border-border px-3 py-2 text-xs min-h-[36px] max-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
                            rows={1}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const target = e.target as HTMLTextAreaElement;
                                if (target.value.trim()) {
                                  handleEditSend(target.value.trim());
                                  target.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {overlayMode === 'code' && (
                    <CodeView canvasId={activeCanvas.id || null} streamingHtml={streamingHtml} />
                  )}
                  {overlayMode === 'settings' && (
                    <CanvasSettings canvasId={activeCanvas?.id || null} settingsVersion={settingsVersion} />
                  )}
                  {overlayMode === 'connections' && (
                    <ConnectedAccounts entityId={activeSessionId || 'anonymous'} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating chat input — always present, starts centered on welcome, persists over canvas */}
            {!showWelcome && (
              <FloatingChat
                onSend={handleSend}
                isLoading={isLoading}
                startCentered={false}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            )}
          </div>
        </div>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
