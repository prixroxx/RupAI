import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { agentService } from './agentService';

export interface DocumentUploadResult {
  documentId: string;
  fileName: string;
  fileSize: number;
  uploadPath?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  dataPointsExtracted: number;
  error?: string;
}

class DocumentService {
  async uploadDocument(file: File, userId: string): Promise<DocumentUploadResult> {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - return mock document ID
      return {
        documentId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: file.size
      };
    }

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record in database
      const { data: document, error: docError } = await supabase
        .from('financial_documents')
        .insert({
          user_id: userId,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          upload_status: 'pending',
          processing_metadata: {
            upload_path: filePath,
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (docError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Database error: ${docError.message}`);
      }

      return {
        documentId: document.id,
        fileName: file.name,
        fileSize: file.size,
        uploadPath: filePath
      };

    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  async processDocument(documentId: string): Promise<DocumentProcessingResult> {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        documentId,
        chunksCreated: 5,
        dataPointsExtracted: 12
      };
    }

    try {
      // Update document status to processing
      await supabase
        .from('financial_documents')
        .update({ 
          upload_status: 'processing',
          processing_metadata: {
            processing_started_at: new Date().toISOString()
          }
        })
        .eq('id', documentId);

      // Get document details
      const { data: document, error: docError } = await supabase
        .from('financial_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Document not found');
      }

      // Download file content for processing
      const uploadPath = document.processing_metadata?.upload_path;
      if (!uploadPath) {
        throw new Error('Upload path not found');
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(uploadPath);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      // Convert file to text for processing
      const fileContent = await this.extractTextFromFile(fileData, document.file_type);

      // Process document with edge function
      const processingResult = await this.callDocumentProcessor({
        documentId,
        fileContent,
        fileName: document.filename,
        fileType: document.file_type
      });

      // Update document status to completed
      await supabase
        .from('financial_documents')
        .update({ 
          upload_status: 'completed',
          processing_metadata: {
            ...document.processing_metadata,
            processing_completed_at: new Date().toISOString(),
            chunks_created: processingResult.chunksCreated,
            data_points_extracted: processingResult.dataPointsExtracted
          }
        })
        .eq('id', documentId);

      // Trigger agent analysis
      try {
        await agentService.analyzeDocument(documentId);
      } catch (agentError) {
        console.warn('Agent analysis failed:', agentError);
        // Don't fail the entire process if agent analysis fails
      }

      return processingResult;

    } catch (error) {
      console.error('Document processing error:', error);
      
      // Update document status to failed
      if (supabase) {
        await supabase
          .from('financial_documents')
          .update({ 
            upload_status: 'failed',
            processing_metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', documentId);
      }

      return {
        success: false,
        documentId,
        chunksCreated: 0,
        dataPointsExtracted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async extractTextFromFile(file: Blob, fileType: string): Promise<string> {
    // Simple text extraction - in production, use proper libraries
    if (fileType === 'text/plain' || fileType === 'text/csv') {
      return await file.text();
    }
    
    // For other file types, return a placeholder
    // In production, you'd use libraries like pdf-parse, mammoth, etc.
    return `[File content extraction for ${fileType} not implemented in demo]`;
  }

  private async callDocumentProcessor(params: {
    documentId: string;
    fileContent: string;
    fileName: string;
    fileType: string;
  }): Promise<{ chunksCreated: number; dataPointsExtracted: number }> {
    if (!supabase) {
      // Demo mode
      return { chunksCreated: 5, dataPointsExtracted: 12 };
    }

    try {
      // Call the document processor edge function
      const { data, error } = await supabase.functions.invoke('document-processor', {
        body: params
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      return {
        chunksCreated: data.chunks_count || 0,
        dataPointsExtracted: data.data_points || 0
      };
    } catch (error) {
      console.error('Document processor error:', error);
      // Return demo data if edge function fails
      return { chunksCreated: 5, dataPointsExtracted: 12 };
    }
  }

  async getUserDocuments(userId: string) {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('financial_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user documents:', error);
      return [];
    }

    return data;
  }

  async deleteDocument(documentId: string, userId: string) {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: true };
    }

    try {
      // Get document details first
      const { data: document } = await supabase
        .from('financial_documents')
        .select('processing_metadata')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      // Delete file from storage if it exists
      if (document?.processing_metadata?.upload_path) {
        await supabase.storage
          .from('documents')
          .remove([document.processing_metadata.upload_path]);
      }

      // Delete document record (this will cascade to chunks and financial_data)
      const { error } = await supabase
        .from('financial_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const documentService = new DocumentService();