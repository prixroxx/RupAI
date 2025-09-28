/*
  # Vector Search Function for RAG

  1. Functions
    - `match_document_chunks` - Semantic search function for document chunks
    - `get_user_financial_summary` - Aggregate user financial data

  2. Security
    - Functions respect RLS policies
    - Only return data for authenticated users
*/

-- Function to search document chunks using vector similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_text,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN financial_documents fd ON dc.document_id = fd.id
  WHERE 
    (user_id IS NULL OR fd.user_id = user_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get user financial summary
CREATE OR REPLACE FUNCTION get_user_financial_summary(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_income', COALESCE(SUM(CASE WHEN data_type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN data_type = 'expense' THEN amount ELSE 0 END), 0),
    'total_debt', COALESCE(SUM(CASE WHEN data_type = 'debt' THEN amount ELSE 0 END), 0),
    'total_savings', COALESCE(SUM(CASE WHEN data_type = 'savings' THEN amount ELSE 0 END), 0),
    'credit_score', (
      SELECT amount 
      FROM financial_data 
      WHERE financial_data.user_id = get_user_financial_summary.user_id 
        AND data_type = 'credit_score' 
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    'expense_categories', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'category', category,
          'amount', SUM(amount),
          'count', COUNT(*)
        )
      )
      FROM financial_data
      WHERE financial_data.user_id = get_user_financial_summary.user_id
        AND data_type = 'expense'
        AND category IS NOT NULL
      GROUP BY category
    ),
    'debt_breakdown', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'category', category,
          'amount', SUM(amount),
          'count', COUNT(*)
        )
      )
      FROM financial_data
      WHERE financial_data.user_id = get_user_financial_summary.user_id
        AND data_type = 'debt'
        AND category IS NOT NULL
      GROUP BY category
    )
  ) INTO result
  FROM financial_data
  WHERE financial_data.user_id = get_user_financial_summary.user_id;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_financial_summary TO authenticated;