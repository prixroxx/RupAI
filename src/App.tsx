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
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'query'>('dashboard');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleDocumentProcessed = async (documentId: string) => {
    setUploadedDocuments(prev => [...prev, documentId]);
    
    // Refresh financial data after document processing
    if (user) {
      await refreshFinancialData();
    }
  };

  const refreshFinancialData = async () => {
    if (!user) return;
    
    setIsLoadingData(true);
    try {
      // Get user's financial data from database
      const financialSummary = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', user.id);
      
      if (financialSummary.data && financialSummary.data.length > 0) {
        // Convert database data to FinancialData format
        const convertedData = convertDatabaseToFinancialData(financialSummary.data);
        setFinancialData(convertedData);
      } else {
        // If no data, show demo data
        setFinancialData(getDemoFinancialData());
      }
    } catch (error) {
      console.error('Error refreshing financial data:', error);
      setFinancialData(getDemoFinancialData());
    } finally {
      setIsLoadingData(false);
    }
  };

  const convertDatabaseToFinancialData = (dbData: any[]): FinancialData => {
    const income = dbData.filter(item => item.data_type === 'income');
    const expenses = dbData.filter(item => item.data_type === 'expense');
    const debts = dbData.filter(item => item.data_type === 'debt');
    const savings = dbData.filter(item => item.data_type === 'savings');
    
    const totalIncome = income.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalDebt = debts.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalSavings = savings.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Group expenses by category
    const expenseCategories: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      expenseCategories[category] = (expenseCategories[category] || 0) + (expense.amount || 0);
    });
    
    const expenseBreakdown = Object.entries(expenseCategories).map(([category, amount]) => ({
      category,
      amount: Math.round(amount / 12), // Convert to monthly
      percentage: Math.round((amount / totalExpenses) * 100)
    }));
    
    return {
      totalIncome,
      totalExpenses,
      totalDebt,
      totalSavings,
      monthlyBudget: Math.round(totalExpenses / 12),
      creditScore: 720, // Default for now
      expenses: expenseBreakdown,
      debts: debts.map(debt => ({
        type: debt.category || 'Unknown',
        amount: debt.amount || 0,
        interestRate: debt.metadata?.interest_rate || 5.0,
        minPayment: Math.round((debt.amount || 0) * 0.02) // 2% minimum payment
      })),
      savingsGoals: [
        { name: 'Emergency Fund', target: totalExpenses * 0.5, current: totalSavings * 0.6, deadline: '2025-12-31' },
        { name: 'Investment Fund', target: 50000, current: totalSavings * 0.4, deadline: '2027-06-30' }
      ]
    };
  };

  const getDemoFinancialData = (): FinancialData => {
    return {
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
  };

  // Load initial data when user is available
  React.useEffect(() => {
    if (user && uploadedDocuments.length === 0) {
      refreshFinancialData();
    }
  }, [user]);

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
      
      {uploadedDocuments.length === 0 ? (
        <>
          <Hero />
          <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
        </>
      ) : (
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Upload More Files Button */}
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
              <DocumentUpload 
                onDocumentProcessed={handleDocumentProcessed} 
                isCompact={true}
                existingDocuments={uploadedDocuments.length}
              />
            </div>

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
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            {activeTab === 'dashboard' && (
              <>
                {isLoadingData ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your financial data...</p>
                  </div>
                ) : financialData ? (
                  <Dashboard data={financialData} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-300">No financial data available. Please upload documents to get started.</p>
                  </div>
                )}
              </>
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