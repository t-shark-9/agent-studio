import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import type { ChatSession, ChatMessage, ContextType } from '@/types/chat';

const getOrCreateBrowserToken = (): string => {
  const key = 'agent_browser_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = uuidv4();
    localStorage.setItem(key, token);
  }
  return token;
};

export function useSessionManager() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const browserToken = getOrCreateBrowserToken();

  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_token', browserToken)
      .order('updated_at', { ascending: false });
    
    if (data) {
      setSessions(data as unknown as ChatSession[]);
      // Don't auto-select a session — let the welcome screen show first
    }
  }, [browserToken, activeSessionId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data as unknown as ChatMessage[]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId, loadMessages]);

  const createSession = useCallback(async (title = 'New Chat', contextType: ContextType = 'chat') => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        session_token: browserToken,
        title,
        context_type: contextType,
        user_id: userData?.user?.id || null,
      })
      .select()
      .single();

    if (data && !error) {
      const session = data as unknown as ChatSession;
      setSessions(prev => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      return session;
    }
    return null;
  }, [browserToken]);

  const addMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!activeSessionId) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: activeSessionId,
        role,
        content,
        metadata: (metadata || {}) as unknown as Record<string, never>,
      }])
      .select()
      .single();

    if (data && !error) {
      const msg = data as unknown as ChatMessage;
      setMessages(prev => [...prev, msg]);
      return msg;
    }
    return null;
  }, [activeSessionId]);

  const updateSessionContext = useCallback(async (sessionId: string, contextType: ContextType, title?: string) => {
    const updates: Record<string, unknown> = { context_type: contextType };
    if (title) updates.title = title;

    await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId);

    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, context_type: contextType, ...(title ? { title } : {}) } : s
    ));
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    setIsLoading,
    setActiveSessionId,
    setMessages,
    createSession,
    addMessage,
    updateSessionContext,
    deleteSession,
    loadSessions,
  };
}
