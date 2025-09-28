/*
  # Financial Documents and RAG System

  1. New Tables
    - `users` - User authentication and profile data
    - `financial_documents` - Uploaded document metadata
    - `document_chunks` - Text chunks from processed documents
    - `financial_data` - Extracted financial information
    - `agent_insights` - AI agent analysis results
    - `chat_sessions` - User query sessions
    - `chat_messages` - Individual chat messages

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data

  3. Extensions
    - Enable vector extension for embeddings
    - Enable uuid extension for primary keys
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Financial documents table
CREATE TABLE IF NOT EXISTS financial_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  upload_status text DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document chunks for RAG
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES financial_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at timestamptz DEFAULT now()
);

-- Extracted financial data
CREATE TABLE IF NOT EXISTS financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES financial_documents(id) ON DELETE CASCADE,
  data_type text NOT NULL CHECK (data_type IN ('income', 'expense', 'debt', 'savings', 'investment', 'credit_score')),
  amount decimal(12,2),
  category text,
  description text,
  date_recorded date,
  metadata jsonb DEFAULT '{}',
  confidence_score decimal(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent insights and recommendations
CREATE TABLE IF NOT EXISTS agent_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_type text NOT NULL CHECK (agent_type IN ('debt_analyzer', 'savings_strategy', 'budget_optimizer')),
  insight_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  recommendations jsonb DEFAULT '[]',
  priority_score integer DEFAULT 1 CHECK (priority_score BETWEEN 1 AND 10),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Financial Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_financial_data_user_id ON financial_data(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_type ON financial_data(data_type);
CREATE INDEX IF NOT EXISTS idx_agent_insights_user_id ON agent_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_insights_type ON agent_insights(agent_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for financial_documents
CREATE POLICY "Users can read own documents"
  ON financial_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON financial_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON financial_documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for document_chunks
CREATE POLICY "Users can read own document chunks"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (document_id IN (
    SELECT id FROM financial_documents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service can manage document chunks"
  ON document_chunks FOR ALL
  TO service_role;

-- RLS Policies for financial_data
CREATE POLICY "Users can read own financial data"
  ON financial_data FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own financial data"
  ON financial_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own financial data"
  ON financial_data FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for agent_insights
CREATE POLICY "Users can read own insights"
  ON agent_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can manage insights"
  ON agent_insights FOR ALL
  TO service_role;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can manage own chat sessions"
  ON chat_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();