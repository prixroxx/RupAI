import React, { useState } from 'react';
import { Send, Bot, User, MessageSquare, TrendingUp, DollarSign, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { agentService } from '../services/agentService';
import type { FinancialData } from '../App';

interface QueryInterfaceProps {
  data: FinancialData;
}

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const QueryInterface: React.FC<QueryInterfaceProps> = ({ data }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'bot',
      content: "Hello! I'm your AI Financial Coach. I've analyzed your financial documents and I'm ready to answer any questions you have about your finances, debt, savings, or budget. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const suggestedQuestions = [
    "How can I pay off my credit card debt faster?",
    "What's the best way to increase my savings?",
    "Should I invest or pay off debt first?",
    "How can I reduce my monthly expenses?",
    "What's my ideal emergency fund amount?",
    "How do I improve my credit score?"
  ];

  const generateResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('credit card') || lowerQuestion.includes('debt')) {
      return `Based on your current debt of $${data.totalDebt.toLocaleString()}, I recommend focusing on your credit card debt first due to its high 18.9% interest rate. Here are specific strategies:

1. **Debt Avalanche Method**: Pay minimums on all debts, then put extra money toward the highest interest rate debt
2. **Consider a balance transfer** to a 0% APR card if you qualify
3. **Add $200 extra monthly** to your credit card payment - this could save you $2,400 in interest
4. **Avoid new charges** on paid-off cards

With consistent extra payments, you could be debt-free by March 2027 instead of 2030.`;
    }
    
    if (lowerQuestion.includes('savings') || lowerQuestion.includes('save')) {
      return `Your current savings rate is ${((data.totalIncome - data.totalExpenses) / data.totalIncome * 100).toFixed(1)}%. Here's how to optimize your savings:

1. **Automate transfers** of $500/month to high-yield savings (currently earning 2.5% vs 0.1%)
2. **Increase 401(k) contribution** to get full employer match - this is free money!
3. **Emergency fund target**: Build to $18,000 (3-6 months of expenses)
4. **Investment allocation**: 60% stocks, 40% bonds for long-term goals

You could potentially increase your savings by $300/month with budget optimizations.`;
    }
    
    if (lowerQuestion.includes('invest') || lowerQuestion.includes('investment')) {
      return `With your current financial situation, here's my investment recommendation:

**Priority Order:**
1. **Pay off high-interest debt first** (18.9% credit card beats most investment returns)
2. **Build emergency fund** to $18,000
3. **Max employer 401(k) match** (instant 100% return)
4. **Then invest** in diversified index funds

**Asset Allocation for your age/situation:**
- 60% Stock index funds (S&P 500, Total Market)
- 40% Bond index funds
- Consider target-date funds for simplicity

Start with $200/month once emergency fund is complete.`;
    }
    
    if (lowerQuestion.includes('expenses') || lowerQuestion.includes('reduce') || lowerQuestion.includes('budget')) {
      return `I've analyzed your monthly expenses of $${(data.totalExpenses/12).toFixed(0)}. Here are optimization opportunities:

**Major Savings Opportunities:**
1. **Housing (38% of income)**: Consider refinancing or roommate - save $300/month
2. **Subscriptions & Entertainment**: Cancel unused services - save $80/month  
3. **Food & Dining**: Meal planning and cooking - save $150/month
4. **Transportation**: Shop insurance, consider carpooling - save $50/month

**Total potential monthly savings: $580**

The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings. You're currently at 87% expenses, 13% savings.`;
    }
    
    if (lowerQuestion.includes('emergency fund')) {
      const recommendedEmergencyFund = Math.round(data.monthlyBudget * 6);
      return `Your ideal emergency fund should be $${recommendedEmergencyFund.toLocaleString()} (6 months of expenses).

**Current status**: $${data.totalSavings.toLocaleString()} saved
**Gap to fill**: $${(recommendedEmergencyFund - data.totalSavings).toLocaleString()}

**Action plan**:
1. **Keep in high-yield savings** (2.5% APY)
2. **Automate $500/month** until fully funded
3. **Timeline**: About ${Math.ceil((recommendedEmergencyFund - data.totalSavings) / 500)} months to complete
4. **Only use for true emergencies**: Job loss, major medical bills, essential repairs

This fund provides peace of mind and prevents debt accumulation during crises.`;
    }
    
    if (lowerQuestion.includes('credit score')) {
      return `Your credit score of ${data.creditScore} is in the "Good" range (670-739). Here's how to improve it:

**Quick wins (30-60 days)**:
1. **Pay down credit card balances** below 30% utilization
2. **Pay all bills on time** - payment history is 35% of score
3. **Don't close old credit cards** - keep credit history length

**Medium-term strategies (3-6 months)**:
1. **Request credit limit increases** to lower utilization ratio
2. **Pay balances before statement date** to show lower balances
3. **Monitor credit reports** for errors and dispute them

**Target score**: 740+ for best rates
**Timeline**: 6-12 months with consistent payments
**Benefit**: Better rates on loans, lower insurance premiums`;
    }

    return `I understand you're asking about "${question}". Based on your financial profile:

- Annual Income: $${data.totalIncome.toLocaleString()}
- Total Debt: $${data.totalDebt.toLocaleString()}
- Savings: $${data.totalSavings.toLocaleString()}
- Credit Score: ${data.creditScore}

Could you be more specific about what aspect of your finances you'd like me to analyze? I can provide detailed guidance on debt payoff strategies, savings optimization, investment allocation, or budget improvements.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Try to get response from Python agents first
      let botResponseContent: string;
      
      if (user) {
        try {
          botResponseContent = await agentService.chatWithAgents(user.id, currentInput, sessionId);
        } catch (error) {
          console.error('Agent service error:', error);
          // Fallback to local response generation
          botResponseContent = generateResponse(currentInput);
        }
      } else {
        botResponseContent = generateResponse(currentInput);
      }
      
      const botMessage: ChatMessage = {
        type: 'bot',
        content: botResponseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage: ChatMessage = {
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting to my analysis systems right now. Please try again in a moment, or check that the Python agents are running.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Chat with RupAI</h2>
              <p className="text-blue-100 text-sm">Your AI Financial Coach is ready to help</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested questions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your finances, debt, savings, or budget..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Monthly Surplus</p>
              <p className="text-lg font-bold text-gray-900">
                ${Math.round((data.totalIncome - data.totalExpenses) / 12).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Debt Payments</p>
              <p className="text-lg font-bold text-gray-900">
                ${data.debts.reduce((sum, debt) => sum + debt.minPayment, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Savings Goals Progress</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round((data.savingsGoals.reduce((sum, goal) => sum + goal.current, 0) / 
                             data.savingsGoals.reduce((sum, goal) => sum + goal.target, 0)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};