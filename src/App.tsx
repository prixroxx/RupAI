import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Auth } from './components/Auth';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DocumentUpload } from './components/DocumentUpload';
import { Dashboard } from './components/Dashboard';
import { QueryInterface } from './components/QueryInterface';
import { AgentInsights } from './components/AgentInsights';
import { Footer } from './components/Footer';

export type FinancialData = {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  totalSavings: number;
  monthlyBudget: number;
  creditScore: number;
  expenses: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  debts: Array<{
    type: string;
    amount: number;
    interestRate: number;
    minPayment: number;
  }>;
  savingsGoals: Array<{
    name: string;
    target: number;
    current: number;
    deadline: string;
  }>;
};

function App() {
  const { user, loading } = useAuth();
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'query'>('dashboard');

  const handleDocumentProcessed = (data: FinancialData) => {
    setFinancialData(data);
    setHasUploadedDocument(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading RupAI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header user={user} />
      
      {!hasUploadedDocument ? (
        <>
          <Hero />
          <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
        </>
      ) : (
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-1 bg-black/70 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-700">
                {[
                  { key: 'dashboard', label: 'Financial Dashboard' },
                  { key: 'agents', label: 'AI Agents' },
                  { key: 'query', label: 'Ask RupAI' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            {activeTab === 'dashboard' && financialData && (
              <Dashboard data={financialData} />
            )}
            {activeTab === 'agents' && financialData && (
              <AgentInsights data={financialData} />
            )}
            {activeTab === 'query' && financialData && (
              <QueryInterface data={financialData} />
            )}
          </div>
        </main>
      )}
      
      <Footer />
    </div>
  );
}

export default App;