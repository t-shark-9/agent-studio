export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id?: string | null;
  session_token: string;
  title: string;
  context_type: ContextType;
  is_ephemeral: boolean;
  canvas_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type ContextType = 'chat' | 'trip' | 'booking' | 'media';

export interface IntentDetection {
  type: ContextType;
  confidence: number;
  entities?: Record<string, string>;
}
