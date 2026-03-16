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
    } else {
      setMessages([]);
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

  const autoTitleSession = useCallback(async (sessionId: string, firstMessage: string) => {
    const cleaned = firstMessage.replace(/\[Attached:.*?\]/g, '').replace(/\[Canvas\]\s*/g, '').trim();
    if (!cleaned) return;

    // Immediate fallback title (shown while AI generates)
    const fallback = cleaned.slice(0, 55).replace(/\s+/g, ' ').trim();
    const fallbackTitle = fallback.length >= 53 ? fallback.slice(0, 50) + '...' : fallback;

    const updateTitle = async (title: string) => {
      await supabase.from('chat_sessions').update({ title }).eq('id', sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    };

    // Show fallback immediately
    await updateTitle(fallbackTitle);

    // Ask AI for a better title in the background
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    try {
      const res = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Generate a short chat session title (3-6 words, no quotes) for this user message. Reply with ONLY the title, nothing else.' },
            { role: 'user', content: cleaned.slice(0, 200) },
          ],
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 20,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const aiTitle = data.choices?.[0]?.message?.content?.trim();
        if (aiTitle && aiTitle.length > 0 && aiTitle.length < 60) {
          await updateTitle(aiTitle);
        }
      }
    } catch {
      // Keep fallback title — already set above
    }
  }, []);

  const addMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>,
    overrideSessionId?: string
  ) => {
    const sid = overrideSessionId || activeSessionId;
    if (!sid) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sid,
        role,
        content,
        metadata: (metadata || {}) as unknown as Record<string, never>,
      }])
      .select()
      .single();

    if (data && !error) {
      const msg = data as unknown as ChatMessage;
      setMessages(prev => {
        const updated = [...prev, msg];
        // Auto-title on first user message
        if (role === 'user' && updated.filter(m => m.role === 'user').length === 1) {
          autoTitleSession(sid, content);
        }
        return updated;
      });
      return msg;
    }
    return null;
  }, [activeSessionId, autoTitleSession]);

  const updateMessageMeta = useCallback(async (messageId: string, metadata: Record<string, unknown>) => {
    await supabase.from('chat_messages').update({
      metadata: metadata as unknown as Record<string, never>,
    }).eq('id', messageId);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, metadata: metadata as unknown as Record<string, never> } : m
    ));
  }, []);

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
    updateMessageMeta,
    updateSessionContext,
    deleteSession,
    loadSessions,
  };
}
