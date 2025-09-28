import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface RAGQuery {
  query: string;
  userId: string;
  maxResults?: number;
  threshold?: number;
}

export interface RAGResult {
  chunks: Array<{
    id: string;
    documentId: string;
    text: string;
    metadata: any;
    similarity: number;
  }>;
  financialContext: any;
  agentInsights: any[];
}

class RAGService {
  async queryDocuments(params: RAGQuery): Promise<RAGResult> {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - return mock results
      return {
        chunks: [
          {
            id: 'demo-chunk-1',
            documentId: 'demo-doc-1',
            text: 'Monthly income: $6,250. Regular expenses include rent ($1,800), utilities ($200), groceries ($400).',
            metadata: { source: 'bank_statement.pdf', page: 1 },
            similarity: 0.85
          },
          {
            id: 'demo-chunk-2',
            documentId: 'demo-doc-1',
            text: 'Credit card balance: $8,500 at 18.9% APR. Minimum payment: $250/month.',
            metadata: { source: 'credit_report.pdf', page: 2 },
            similarity: 0.78
          }
        ],
        financialContext: {
          total_income: 75000,
          total_debt: 35000,
          total_savings: 12000
        },
        agentInsights: []
      };
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(params.query);

      // Search for similar document chunks
      const { data: chunks, error: chunksError } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: params.threshold || 0.7,
        match_count: params.maxResults || 10,
        user_id: params.userId
      });

      if (chunksError) {
        console.error('Error searching document chunks:', chunksError);
      }

      // Get user's financial context
      const { data: financialContext, error: contextError } = await supabase.rpc('get_user_financial_summary', {
        user_id: params.userId
      });

      if (contextError) {
        console.error('Error getting financial context:', contextError);
      }

      // Get recent agent insights
      const { data: agentInsights, error: insightsError } = await supabase
        .from('agent_insights')
        .select('*')
        .eq('user_id', params.userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (insightsError) {
        console.error('Error getting agent insights:', insightsError);
      }

      return {
        chunks: chunks?.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.document_id,
          text: chunk.chunk_text,
          metadata: chunk.metadata,
          similarity: chunk.similarity
        })) || [],
        financialContext: financialContext || {},
        agentInsights: agentInsights || []
      };

    } catch (error) {
      console.error('RAG query error:', error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // In a real implementation, you'd call OpenAI or another embedding service
    // For now, return a mock embedding vector
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }

  async getDocumentChunks(documentId: string, userId: string) {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('document_chunks')
      .select(`
        *,
        financial_documents!inner(user_id)
      `)
      .eq('document_id', documentId)
      .eq('financial_documents.user_id', userId)
      .order('chunk_index');

    if (error) {
      console.error('Error fetching document chunks:', error);
      return [];
    }

    return data;
  }

  async searchSimilarContent(text: string, userId: string, excludeDocumentId?: string) {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const embedding = await this.generateEmbedding(text);
      
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: embedding,
        match_threshold: 0.6,
        match_count: 5,
        user_id: userId
      });

      if (error) {
        console.error('Error searching similar content:', error);
        return [];
      }

      // Filter out chunks from excluded document
      return data?.filter((chunk: any) => 
        !excludeDocumentId || chunk.document_id !== excludeDocumentId
      ) || [];

    } catch (error) {
      console.error('Error in similarity search:', error);
      return [];
    }
  }
}

export const ragService = new RAGService();