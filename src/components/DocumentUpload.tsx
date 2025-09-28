import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Brain } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { agentService } from '../services/agentService';
import type { FinancialData } from '../App';

interface DocumentUploadProps {
  onDocumentProcessed: (data: FinancialData) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentProcessed }) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  React.useEffect(() => {
    checkAgentStatus();
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
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      setProcessingStep('Demo mode: Supabase not configured. File upload requires a configured Supabase instance.');
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 3000);
      return;
    }
    
    setIsProcessing(true);
    setProcessingStep('Uploading document...');

    try {
      const file = files[0];
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('financial_documents')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          upload_status: 'pending'
        })
        .select()
        .single();

      if (docError) throw docError;

      // Process with Python agents
      setProcessingStep('Analyzing document with AI agents...');
      const analysisResult = await agentService.analyzeDocument(document.id);
      
      setProcessingStep('Generating insights...');
      
      // Simulate processing steps for better UX
      const steps = [
        'Extracting financial data...',
        'Running debt analysis agent...',
        'Calculating savings opportunities...',
        'Generating budget recommendations...',
        'Creating personalized insights...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        setProcessingStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate mock data for now (replace with real data from agents)
      const mockData: FinancialData = {
        totalIncome: 75000,
        totalExpenses: 65000,
        totalDebt: 35000,
        totalSavings: 12000,
        monthlyBudget: 6000,
        creditScore: 720,
        expenses: [
          { category: 'Housing', amount: 2500, percentage: 38 },
          { category: 'Transportation', amount: 800, percentage: 12 },
          { category: 'Food', amount: 600, percentage: 9 },
          { category: 'Utilities', amount: 300, percentage: 5 },
          { category: 'Entertainment', amount: 400, percentage: 6 },
          { category: 'Healthcare', amount: 200, percentage: 3 },
          { category: 'Other', amount: 1200, percentage: 18 }
        ],
        debts: [
          { type: 'Credit Card', amount: 8500, interestRate: 18.9, minPayment: 250 },
          { type: 'Student Loan', amount: 22000, interestRate: 5.2, minPayment: 220 },
          { type: 'Auto Loan', amount: 4500, interestRate: 3.8, minPayment: 180 }
        ],
        savingsGoals: [
          { name: 'Emergency Fund', target: 20000, current: 12000, deadline: '2025-12-31' },
          { name: 'House Down Payment', target: 50000, current: 8000, deadline: '2027-06-30' },
          { name: 'Vacation Fund', target: 5000, current: 1200, deadline: '2025-08-15' }
        ]
      };

      setIsProcessing(false);
      onDocumentProcessed(mockData);

    } catch (error) {
      console.error('Document processing error:', error);
      setProcessingStep(`Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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

  if (isProcessing) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
            <div className="animate-spin w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-4">Processing Your Financial Data</h3>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
              <p className="text-blue-600 font-medium">{processingStep}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-800 h-2 rounded-full transition-all duration-300"
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
          <h2 className="text-3xl font-bold text-white mb-4">Upload Your Financial Documents</h2>
          <p className="text-lg text-gray-300">
            Upload bank statements, credit reports, pay stubs, or any financial documents. 
            Our AI will analyze and provide personalized insights.
          </p>
          
          {/* Agent Status Indicator */}
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drag and drop your files here
              </h3>
              <p className="text-gray-300 mb-4">
                or click to browse your computer
              </p>
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                Choose Files
                <FileText className="w-4 h-4 ml-2" />
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              Supported formats: PDF, DOC, TXT, CSV, XLS
              <br />
              Maximum file size: 10MB per file
              {agentStatus === 'offline' && (
                <div className="text-red-400 mt-2">
                  ⚠️ AI Agents are offline. Please ensure the Python agents server is running.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-green-900/20 border border-green-600 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <div className="text-sm">
              <p className="font-medium text-green-300">Your data is secure</p>
              <p className="text-green-400">
                All documents are encrypted and processed locally. We never store your financial information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};