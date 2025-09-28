import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  sessionId: string
  message: string
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, message, userId }: ChatRequest = await req.json()

    // Store user message
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: message
      })

    // Get relevant context using RAG
    const context = await getRelevantContext(supabase, userId, message)
    
    // Get AI response
    const aiResponse = await generateAIResponse(message, context)

    // Store AI response
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: aiResponse
      })

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Chat query error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getRelevantContext(supabase: any, userId: string, query: string) {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)
  
  // Search for similar document chunks
  const { data: chunks } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 5,
    user_id: userId
  })

  // Get user's financial data
  const { data: financialData } = await supabase
    .from('financial_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get recent agent insights
  const { data: insights } = await supabase
    .from('agent_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    documentChunks: chunks || [],
    financialData: financialData || [],
    agentInsights: insights || []
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  const data = await response.json()
  return data.data[0].embedding
}

async function generateAIResponse(query: string, context: any): Promise<string> {
  // You can also call Python agents here if needed
  // const agentEndpoint = `${Deno.env.get('PYTHON_AGENTS_URL')}/chat`
  
  const systemPrompt = `You are RupAI, an expert AI Financial Coach. Use the provided context to answer the user's financial questions with personalized, actionable advice.

Context:
- Document chunks: ${JSON.stringify(context.documentChunks)}
- Financial data: ${JSON.stringify(context.financialData)}
- Agent insights: ${JSON.stringify(context.agentInsights)}

Provide specific, actionable financial advice based on the user's actual financial situation.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  const data = await response.json()
  return data.choices[0].message.content
}