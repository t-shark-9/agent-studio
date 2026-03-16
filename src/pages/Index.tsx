import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Layout, Code2, Sparkles } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { TaskRail } from '@/components/TaskRail';
import { ChatPane } from '@/components/ChatPane';
import { CanvasHome } from '@/components/CanvasHome';
import { CanvasEmbed } from '@/components/CanvasEmbed';
import { CodeView } from '@/components/CodeView';
import { AuthModal } from '@/components/AuthModal';
import { useSessionManager } from '@/hooks/useSessionManager';
import { detectIntent } from '@/hooks/useIntentDetection';
import { useAgent } from '@/hooks/useAgent';
import type { ContextType } from '@/types/chat';

type ViewMode = 'canvas' | 'chat' | 'code';

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
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4.6');
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');

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

  // Background template extraction after canvas is created
  const extractTemplate = useCallback(async (canvasId: string) => {
    try {
      await fetch(`${CANVAS_URL}/api/templates/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasId }),
      });
    } catch {
      // Silent background operation
    }
  }, []);

  const handleOpenCanvas = useCallback((canvas: CanvasData) => {
    setActiveCanvas(canvas);
    setViewMode('canvas');
  }, []);

  const handleSend = useCallback(async (content: string) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    await addMessage('user', content);

    // Detect intent
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

    // Get AI response from OpenClaw
    setIsLoading(true);
    try {
      const response = await getResponse(content, contextType, selectedModel);

      if (response.type === 'canvas' && response.canvas) {
        await addMessage('assistant', response.content, { canvas: response.canvas });
        setActiveCanvas(response.canvas);
        setViewMode('canvas');
        // Background: extract template for reuse
        extractTemplate(response.canvas.id);
      } else {
        await addMessage('assistant', response.content);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
    setIsLoading(false);
  }, [activeSessionId, activeSession, addMessage, createSession, getResponse, setIsLoading, updateSessionContext, selectedModel, extractTemplate]);

  const handleStartFlow = useCallback((message: string) => {
    handleSend(message);
    // Switch to chat while we wait for the response (canvas will auto-open)
    setViewMode('chat');
  }, [handleSend]);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    try {
      const res = await fetch(`${CANVAS_URL}/api/templates/${templateId}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCanvas({
          id: data.canvasId,
          url: data.url,
          embedUrl: data.embedUrl,
          title: data.title,
        });
        setViewMode('canvas');
      }
    } catch {
      // ignore
    }
  }, []);

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
    setViewMode('canvas');
  }, [createSession]);

  const VIEW_TABS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: 'canvas', icon: Layout, label: 'Canvas' },
    { mode: 'chat', icon: MessageSquare, label: 'Chat' },
    { mode: 'code', icon: Code2, label: 'Code' },
  ];

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
          onSelectSession={(id) => { setActiveSessionId(id); setActiveCanvas(null); }}
          onNewSession={handleNewSession}
          onDeleteSession={deleteSession}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* View toggle bar */}
          <div className="h-10 border-b border-border flex items-center px-3 gap-1 shrink-0 bg-card/50">
            {VIEW_TABS.map(tab => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === tab.mode
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}

            {activeCanvas && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="font-medium">{activeCanvas.title}</span>
              </div>
            )}
          </div>

          {/* View content */}
          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {viewMode === 'canvas' && (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {activeCanvas ? (
                    <CanvasEmbed canvasId={activeCanvas.id} onCanvasAction={handleCanvasAction} />
                  ) : (
                    <CanvasHome onStartFlow={handleStartFlow} onUseTemplate={handleUseTemplate} />
                  )}
                </motion.div>
              )}

              {viewMode === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <ChatPane
                    messages={messages}
                    isLoading={isLoading}
                    onSend={handleSend}
                    onOpenCanvas={handleOpenCanvas}
                  />
                </motion.div>
              )}

              {viewMode === 'code' && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <CodeView canvasId={activeCanvas?.id || null} />
                </motion.div>
              )}
            </AnimatePresence>
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
