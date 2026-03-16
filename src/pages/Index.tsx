import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StatusBar } from '@/components/StatusBar';
import { TaskRail } from '@/components/TaskRail';
import { ChatPane } from '@/components/ChatPane';
import { ContextPanel } from '@/components/ContextPanel';
import { AuthModal } from '@/components/AuthModal';
import { useSessionManager } from '@/hooks/useSessionManager';
import { detectIntent } from '@/hooks/useIntentDetection';
import { useMockAgent } from '@/hooks/useMockAgent';
import type { ContextType } from '@/types/chat';

const Index = () => {
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);

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

  const { getResponse } = useMockAgent();

  const handleSend = useCallback(async (content: string) => {
    // Ensure we have a session
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await createSession();
      if (!session) return;
      currentSessionId = session.id;
    }

    // Add user message
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
      setContextCollapsed(false);
    }

    // Get AI response
    setIsLoading(true);
    const response = await getResponse(content, contextType);
    await addMessage('assistant', response);
    setIsLoading(false);
  }, [activeSessionId, activeSession, addMessage, createSession, getResponse, setIsLoading, updateSessionContext]);

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
    if (ctx !== 'chat') setContextCollapsed(false);
  }, [createSession]);

  const currentContextType = (activeSession?.context_type as ContextType) || 'chat';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <StatusBar
        isEphemeral={isEphemeral}
        onToggleEphemeral={() => setIsEphemeral(e => !e)}
        onAuthClick={() => setShowAuth(true)}
      />

      <div className="flex-1 flex min-h-0">
        <TaskRail
          sessions={sessions}
          activeSessionId={activeSessionId}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed(c => !c)}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
          onDeleteSession={deleteSession}
        />

        <ChatPane
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
        />

        <ContextPanel
          contextType={currentContextType}
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
