import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Code2, Sparkles } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { TaskRail } from '@/components/TaskRail';
import { CanvasEmbed } from '@/components/CanvasEmbed';
import { CodeView } from '@/components/CodeView';
import { FloatingChat } from '@/components/FloatingChat';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthModal } from '@/components/AuthModal';
import { refreshTemplateCache } from '@/components/CanvasHome';
import { useSessionManager } from '@/hooks/useSessionManager';
import { detectIntent } from '@/hooks/useIntentDetection';
import { useAgent } from '@/hooks/useAgent';
import type { ContextType } from '@/types/chat';
import type { AttachedFile } from '@/components/MessageComposer';

type OverlayMode = 'none' | 'chat' | 'code';

const CANVAS_URL = import.meta.env.VITE_CANVAS_URL || '/canvas';

interface CanvasData {
  id: string;
  url: string;
  embedUrl: string;
  title: string;
}

const Index = () => {
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4.6');
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');

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
    updateSessionContext,
    deleteSession,
  } = useSessionManager();

  const { getResponse } = useAgent();

  // Show welcome when no active session
  const showWelcome = !activeSessionId && messages.length === 0 && !activeCanvas;

  // Restore canvas when switching sessions
  useEffect(() => {
    if (!messages.length) {
      setActiveCanvas(null);
      return;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const meta = messages[i].metadata as Record<string, unknown> | undefined;
      const canvas = meta?.canvas as CanvasData | undefined;
      if (canvas?.id) {
        setActiveCanvas(canvas);
        return;
      }
    }
    setActiveCanvas(null);
  }, [activeSessionId, messages]);

  // Listen for postMessage from canvas iframes
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'canvas-action') {
        const actionText = `[Selected: ${e.data.action}] ${JSON.stringify(e.data.data)}`;
        handleSend(actionText);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Background template extraction
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

    // Build metadata with file info
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
      const fileDescs = files.map(f => `[Attached: ${f.file.name} (${f.file.type}, ${(f.file.size / 1024).toFixed(0)}KB)]`);
      fullContent = fileDescs.join('\n') + (content ? '\n' + content : '');
    }

    await addMessage('user', fullContent, Object.keys(metadata).length > 0 ? metadata : undefined);

    const intent = detectIntent(content);
    let contextType: ContextType = activeSession?.context_type as ContextType || 'chat';

    if (intent) {
      contextType = intent.type;
      await updateSessionContext(currentSessionId, intent.type,
        intent.type === 'trip' ? `Trip${intent.entities?.destination ? ` to ${intent.entities.destination}` : ''}` :
        intent.type === 'booking' ? 'Restaurant Booking' :
        intent.type === 'media' ? 'Media Creation' : 'Chat'
      );
    }

    setIsLoading(true);
    try {
      const response = await getResponse(fullContent, contextType, selectedModel);

      if (response.type === 'canvas' && response.canvas) {
        await addMessage('assistant', response.content, { canvas: response.canvas });
        setActiveCanvas(response.canvas);
        setRailCollapsed(false);
        extractTemplate(response.canvas.id);
      } else {
        await addMessage('assistant', response.content);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
    setIsLoading(false);
  }, [activeSessionId, activeSession, addMessage, createSession, getResponse, setIsLoading, updateSessionContext, selectedModel, extractTemplate]);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    try {
      const res = await fetch(`${CANVAS_URL}/api/templates/${templateId}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const canvas = {
          id: data.canvasId,
          url: data.url,
          embedUrl: data.embedUrl,
          title: data.title,
        };
        setActiveCanvas(canvas);
        setRailCollapsed(false);
        await addMessage('user', `Use template: ${data.title}`);
        await addMessage('assistant', `Here's your ${data.title}. You can interact with it or ask me to make changes.`, { canvas });
      }
    } catch {
      // ignore
    }
  }, [activeSessionId, createSession, addMessage]);

  const handleCanvasAction = useCallback((action: string, payload: Record<string, unknown>) => {
    const summary = payload.summary || payload.label || action;
    handleSend(`[Canvas] ${summary}`);
  }, [handleSend]);

  const handleNewSession = useCallback(async (contextType?: ContextType) => {
    const titles: Record<ContextType, string> = {
      chat: 'New Chat',
      trip: 'Trip Planning',
      booking: 'Restaurant Booking',
      media: 'Media Creation',
    };
    const ctx = contextType || 'chat';
    await createSession(titles[ctx], ctx);
    setActiveCanvas(null);
    setOverlayMode('none');
  }, [createSession]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setOverlayMode('none');
  }, [setActiveSessionId]);

  const toggleOverlay = useCallback((mode: OverlayMode) => {
    setOverlayMode(prev => prev === mode ? 'none' : mode);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <StatusBar
        isEphemeral={isEphemeral}
        onToggleEphemeral={() => setIsEphemeral(e => !e)}
        onAuthClick={() => setShowAuth(true)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <div className="flex-1 flex min-h-0">
        <TaskRail
          sessions={sessions}
          activeSessionId={activeSessionId}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed(c => !c)}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={deleteSession}
        />

        {/* Main content — single unified area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Canvas title bar + view toggles — only when canvas is active */}
          {activeCanvas && (
            <div className="h-10 border-b border-border flex items-center px-3 gap-1 shrink-0 bg-card/50 z-10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="font-medium">{activeCanvas.title}</span>
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
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              {showWelcome ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <WelcomeScreen onSend={handleSend} onUseTemplate={handleUseTemplate} />
                </motion.div>
              ) : activeCanvas ? (
                <motion.div
                  key={`canvas-${activeCanvas.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <CanvasEmbed canvasId={activeCanvas.id} onCanvasAction={handleCanvasAction} />
                </motion.div>
              ) : (
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

            {/* Chat/Code overlay panel — slides in from the right */}
            <AnimatePresence>
              {overlayMode !== 'none' && activeCanvas && (
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
                      <div className="p-3 border-b border-border flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Chat</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                        {messages.map(msg => {
                          const isUser = msg.role === 'user';
                          return (
                            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
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
                            placeholder="Type a message..."
                            className="flex-1 resize-none rounded-lg bg-secondary border border-border px-3 py-2 text-xs min-h-[36px] max-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
                            rows={1}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const target = e.target as HTMLTextAreaElement;
                                if (target.value.trim()) {
                                  handleSend(target.value.trim());
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
                    <CodeView canvasId={activeCanvas.id} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating draggable chat bubble — always present when not on welcome */}
            {!showWelcome && overlayMode !== 'chat' && (
              <FloatingChat
                messages={messages}
                isLoading={isLoading}
                onSend={handleSend}
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
