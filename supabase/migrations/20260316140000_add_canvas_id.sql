-- Add canvas_id to sessions for canvas persistence
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS canvas_id TEXT;
