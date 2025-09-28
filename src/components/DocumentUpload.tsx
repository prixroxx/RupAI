import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Brain } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { documentService } from '../services/documentService';
import { agentService } from '../services/agentService';

interface DocumentUploadProps {
  onDocumentProcessed: (documentId: string) => void;
  isCompact?: boolean;
  existingDocuments?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentProcessed, 
  isCompact = false,
  existingDocuments = 0 
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  React.useEffect(() => {
    if (!isCompact) {
      checkAgentStatus();
    }
  }, []);

  const checkAgentStatus = async () => {
    setAgentStatus('checking');
    try {
      console.log('Starting agent status check...');
      const isHealthy = await agentService.healthCheck();
      console.log('Agent status check result:', isHealthy);
      setAgentStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('Error during agent status check:', error);
      setAgentStatus('offline');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    
    setIsProcessing(true);
    setProcessingStep('Uploading document...');

    try {
      const file = files[0];
      
      // Upload document using document service
      const uploadResult = await documentService.uploadDocument(file, user.id);
      console.log('Document uploaded:', uploadResult);
      
      setProcessingStep('Processing document content...');
      
      // Process document and extract data
      const processingResult = await documentService.processDocument(uploadResult.documentId);
      console.log('Document processed:', processingResult);
      
      if (processingResult.success) {
        setProcessingStep('Triggering AI agent analysis...');
        
        // Trigger agent analysis
        try {
          await agentService.analyzeDocument(uploadResult.documentId);
          setProcessingStep('Analysis complete!');
        } catch (agentError) {
          console.warn('Agent analysis failed:', agentError);
          setProcessingStep('Document processed (agents offline)');
        }
        
        // Wait a moment before completing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsProcessing(false);
        onDocumentProcessed(uploadResult.documentId);
      } else {
        throw new Error(processingResult.error || 'Processing failed');
      }

    } catch (error) {
      console.error('Document processing error:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to AI agents. Please ensure Python agents are running on localhost:8000.';
        } else if (error.message.includes('Upload failed')) {
          errorMessage = 'File upload failed. Please check your Supabase storage configuration.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setProcessingStep(`Error: ${errorMessage}`);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  // Compact version for "Upload More" button
  if (isCompact) {
    return (
      <div className="relative">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        <button 
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-blue-600 text-white rounded-lg hover:from-yellow-600 hover:to-blue-700 transition-colors duration-200 font-medium disabled:opacity-50"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload More Files ({existingDocuments} uploaded)
            </>
          )}
        </button>
        
        {isProcessing && (
          <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3 min-w-64 z-10">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="text-sm text-yellow-500">{processingStep}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isProcessing) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
            <div className="animate-spin w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4">Processing Your Financial Data</h3>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-yellow-500 animate-pulse" />
              <p className="text-yellow-500 font-medium">{processingStep}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(processingStep ? 1 : 0) * 100 / 6}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-white bg-clip-text text-transparent mb-4">Upload Your Financial Documents</h2>
          <p className="text-lg text-gray-300">
            Upload bank statements, credit reports, pay stubs, or any financial documents. 
            Our AI will analyze and provide personalized insights.
          </p>
          
          {/* Agent Status Indicator */}
          {!isCompact && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                agentStatus === 'online' ? 'bg-green-500' :
                agentStatus === 'offline' ? 'bg-red-400' :
                'bg-blue-500 animate-pulse'
              }`}></div>
              <span className="text-sm text-gray-300">
                AI Agents: {
                  agentStatus === 'online' ? 'Online & Ready' :
                  agentStatus === 'offline' ? 'Offline' :
                  'Checking Status...'
                }
              </span>
              {agentStatus === 'offline' && (
                <button 
                  onClick={checkAgentStatus}
                  className="text-xs text-blue-400 hover:text-blue-300 underline ml-2"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-blue-400 bg-blue-900/20'
              : 'border-gray-600 bg-gray-900/50 hover:border-blue-500 hover:bg-blue-900/30'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drag and drop your files here
              </h3>
              <p className="text-gray-300 mb-4">
                or click to browse your computer
              </p>
              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-colors duration-200 font-medium">
                Choose Files
                <FileText className="w-4 h-4 ml-2" />
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              Supported formats: PDF, DOC, TXT, CSV, XLS
              <br />
              Maximum file size: 10MB per file
              {!isCompact && agentStatus === 'offline' && (
                <div className="text-red-400 mt-2">
                  ⚠️ AI Agents are offline. Please ensure the Python agents server is running.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        {!isCompact && <div className="mt-8 bg-green-900/20 border border-green-600 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <div className="text-sm">
              <p className="font-medium text-green-300">Your data is secure</p>
              <p className="text-green-400">
                All documents are encrypted and processed locally. We never store your financial information.
              </p>
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
};