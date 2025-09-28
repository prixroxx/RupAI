/*
  # Setup Supabase Storage for Document Upload and RAG Processing

  1. Storage Setup
    - Create 'documents' bucket for file uploads
    - Set up RLS policies for secure access
    - Configure file type and size restrictions

  2. Document Processing
    - Enable automatic processing after upload
    - Setup for RAG (Retrieval Augmented Generation)
    - Vector embeddings for semantic search

  3. Security
    - Users can only access their own documents
    - Secure file upload and retrieval
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to match document chunks for RAG queries
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
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

-- Function to get user financial summary for RAG context
CREATE OR REPLACE FUNCTION get_user_financial_summary(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_income', COALESCE(SUM(CASE WHEN data_type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN data_type = 'expense' THEN amount ELSE 0 END), 0),
    'total_debt', COALESCE(SUM(CASE WHEN data_type = 'debt' THEN amount ELSE 0 END), 0),
    'total_savings', COALESCE(SUM(CASE WHEN data_type = 'savings' THEN amount ELSE 0 END), 0),
    'document_count', (SELECT COUNT(*) FROM financial_documents WHERE financial_documents.user_id = get_user_financial_summary.user_id),
    'last_updated', MAX(updated_at)
  )
  INTO summary
  FROM financial_data
  WHERE financial_data.user_id = get_user_financial_summary.user_id;
  
  RETURN COALESCE(summary, '{}'::jsonb);
END;
$$;

-- Trigger to automatically process documents after upload
CREATE OR REPLACE FUNCTION trigger_document_processing()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger processing for newly uploaded documents
  IF NEW.upload_status = 'pending' AND (OLD IS NULL OR OLD.upload_status != 'pending') THEN
    -- This would typically call an edge function or external service
    -- For now, we'll just update the metadata to indicate processing should start
    NEW.processing_metadata = jsonb_build_object(
      'processing_triggered_at', NOW(),
      'processing_status', 'queued'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic document processing
DROP TRIGGER IF EXISTS auto_process_documents ON financial_documents;
CREATE TRIGGER auto_process_documents
  BEFORE UPDATE ON financial_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_document_processing();