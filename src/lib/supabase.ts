import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your_supabase_anon_key'

if (!hasValidSupabaseConfig) {
  console.warn('Supabase not configured. Using demo mode.')
}

// Create Supabase client with fallback for demo mode
export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if Supabase is available
export const isSupabaseConfigured = () => hasValidSupabaseConfig

// Database types
export interface FinancialDocument {
  id: string
  user_id: string
  filename: string
  file_type: string
  file_size: number
  upload_status: 'pending' | 'processing' | 'completed' | 'failed'
  processing_metadata: any
  created_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  chunk_text: string
  chunk_index: number
  metadata: any
  embedding: number[]
  created_at: string
}

export interface FinancialDataPoint {
  id: string
  user_id: string
  document_id?: string
  data_type: 'income' | 'expense' | 'debt' | 'savings' | 'investment' | 'credit_score'
  amount?: number
  category?: string
  description?: string
  date_recorded?: string
  metadata: any
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface AgentInsight {
  id: string
  user_id: string
  agent_type: 'debt_analyzer' | 'savings_strategy' | 'budget_optimizer'
  insight_type: string
  title: string
  content: string
  recommendations: any[]
  priority_score: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: any
  created_at: string
}