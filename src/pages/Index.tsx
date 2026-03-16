import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StatusBar } from '@/components/StatusBar';
import { TaskRail } from '@/components/TaskRail';
import { ChatPane } from '@/components/ChatPane';
import { ContextPanel } from '@/components/ContextPanel';
import { AuthModal } from '@/components/AuthModal';
import { useSessionManager } from '@/hooks/useSessionManager';
import { detectIntent } from '@/hooks/useIntentDetection';
import { useAgent } from '@/hooks/useAgent';
import type { ContextType } from '@/types/chat';

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
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4.6');
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null);

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

  const handleOpenCanvas = useCallback((canvas: CanvasData) => {
    setActiveCanvas(canvas);
    setContextCollapsed(false);
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
        setContextCollapsed(false);
      } else {
        await addMessage('assistant', response.content);
      }
    } catch {
      await addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
    setIsLoading(false);
  }, [activeSessionId, activeSession, addMessage, createSession, getResponse, setIsLoading, updateSessionContext, selectedModel]);

  const handleContextAction = useCallback((message: string) => {
    handleSend(message);
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
    if (ctx !== 'chat') setContextCollapsed(false);
  }, [createSession]);

  const currentContextType = (activeSession?.context_type as ContextType) || 'chat';

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

        <ChatPane
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          onOpenCanvas={handleOpenCanvas}
        />

        <ContextPanel
          contextType={currentContextType}
          canvasId={activeCanvas?.id || null}
          collapsed={contextCollapsed}
          onToggleCollapse={() => setContextCollapsed(c => !c)}
          onAction={handleContextAction}
        />
      </div>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
