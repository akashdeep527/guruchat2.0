-- Create session status enum (only if not exists)
DO $$ BEGIN
    CREATE TYPE public.session_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table for the chat app
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_helper BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate INTEGER; -- Rate in paise (Indian currency smallest unit)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  helper_id UUID NOT NULL,
  status session_status DEFAULT 'pending',
  hourly_rate INTEGER NOT NULL, -- Rate in paise per hour
  total_amount INTEGER DEFAULT 0, -- Total amount in paise
  duration_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  client_id UUID NOT NULL,
  helper_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- Amount in paise
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
FOR SELECT USING (
  auth.uid() = client_id OR 
  auth.uid() = helper_id OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create chat sessions as clients" ON public.chat_sessions
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Participants can update their chat sessions" ON public.chat_sessions
FOR UPDATE USING (
  auth.uid() = client_id OR 
  auth.uid() = helper_id OR 
  has_role(auth.uid(), 'admin')
);

-- RLS Policies for messages
CREATE POLICY "Session participants can view messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = messages.session_id 
    AND (chat_sessions.client_id = auth.uid() OR chat_sessions.helper_id = auth.uid())
  ) OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Session participants can send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = messages.session_id 
    AND (chat_sessions.client_id = auth.uid() OR chat_sessions.helper_id = auth.uid())
  )
);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
FOR SELECT USING (
  auth.uid() = client_id OR 
  auth.uid() = helper_id OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only system can create payments" ON public.payments
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;