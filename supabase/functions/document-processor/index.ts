import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentProcessRequest {
  documentId: string
  fileContent: string
  fileName: string
  fileType: string
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

    const { documentId, fileContent, fileName, fileType }: DocumentProcessRequest = await req.json()

    // Update document status to processing
    await supabase
      .from('financial_documents')
      .update({ upload_status: 'processing' })
      .eq('id', documentId)

    // Process document content (simplified text extraction)
    const chunks = await processDocumentContent(fileContent, fileType)
    
    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await generateEmbedding(chunk.text)
        return {
          document_id: documentId,
          chunk_text: chunk.text,
          chunk_index: index,
          metadata: chunk.metadata,
          embedding: embedding
        }
      })
    )

    // Store chunks in database
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunksWithEmbeddings)

    if (chunksError) throw chunksError

    // Extract financial data using AI
    const financialData = await extractFinancialData(fileContent, documentId)
    
    // Store financial data
    if (financialData.length > 0) {
      const { error: dataError } = await supabase
        .from('financial_data')
        .insert(financialData)

      if (dataError) throw dataError
    }

    // Update document status to completed
    await supabase
      .from('financial_documents')
      .update({ 
        upload_status: 'completed',
        processing_metadata: { chunks_count: chunks.length, data_points: financialData.length }
      })
      .eq('id', documentId)

    // Trigger agent analysis
    await triggerAgentAnalysis(documentId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed successfully',
        chunks_count: chunks.length,
        data_points: financialData.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Document processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processDocumentContent(content: string, fileType: string) {
  // Simple text chunking (in production, use more sophisticated methods)
  const chunkSize = 1000
  const overlap = 200
  const chunks = []
  
  for (let i = 0; i < content.length; i += chunkSize - overlap) {
    const chunk = content.slice(i, i + chunkSize)
    chunks.push({
      text: chunk,
      metadata: {
        start_index: i,
        end_index: i + chunk.length,
        file_type: fileType
      }
    })
  }
  
  return chunks
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

async function extractFinancialData(content: string, documentId: string) {
  // Use OpenRouter to extract structured financial data
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{
        role: 'user',
        content: `Extract financial data from this document and return as JSON array with objects containing: data_type, amount, category, description, date_recorded, confidence_score. Document content: ${content.slice(0, 4000)}`
      }],
      temperature: 0.1,
    }),
  })

  const data = await response.json()
  const extractedData = JSON.parse(data.choices[0].message.content)
  
  return extractedData.map((item: any) => ({
    ...item,
    document_id: documentId,
    user_id: null // Will be set by RLS
  }))
}

async function triggerAgentAnalysis(documentId: string) {
  // Trigger Python agents for analysis
  const agentEndpoint = `${Deno.env.get('PYTHON_AGENTS_URL')}/analyze-document`
  
  try {
    await fetch(agentEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId })
    })
  } catch (error) {
    console.error('Failed to trigger agent analysis:', error)
    // Don't throw error to avoid breaking document processing
  }
}