
-- Create chat_sessions table (supports both authenticated and anonymous users)
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  context_type TEXT NOT NULL DEFAULT 'chat',
  is_ephemeral BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: open access for MVP (anonymous + auth users)
CREATE POLICY "Anyone can view sessions"
  ON public.chat_sessions FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions"
  ON public.chat_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON public.chat_sessions FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete sessions"
  ON public.chat_sessions FOR DELETE USING (true);

-- Messages: open access
CREATE POLICY "Anyone can view messages"
  ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_session_token ON public.chat_sessions(session_token);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
