import React from 'react';
import { Bot, Target, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { FinancialData } from '../App';

interface AgentInsightsProps {
  data: FinancialData;
}

export const AgentInsights: React.FC<AgentInsightsProps> = ({ data }) => {
  // Calculate insights
  const debtToIncomeRatio = (data.totalDebt / data.totalIncome * 100).toFixed(1);
  const savingsRate = ((data.totalIncome - data.totalExpenses) / data.totalIncome * 100).toFixed(1);
  const monthlyDebtPayments = data.debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  
  return (
    <div className="space-y-8">
      {/* Agent Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <Bot className="w-8 h-8" />
            <h3 className="text-lg font-bold">Debt Analyzer Agent</h3>
          </div>
          <p className="text-blue-100">Analyzing your debt structure and optimization opportunities</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <h3 className="text-lg font-bold">Savings Strategy Agent</h3>
          </div>
          <p className="text-green-100">Creating personalized savings and investment plans</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-8 h-8" />
            <h3 className="text-lg font-bold">Budget Optimization Agent</h3>
          </div>
          <p className="text-purple-100">Optimizing your spending and budget allocation</p>
        </div>
      </div>

      {/* Debt Analyzer Insights */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Debt Analysis & Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-900">Current Debt-to-Income Ratio: {debtToIncomeRatio}%</span>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Debt Payoff Strategy</h4>
              <ul className="space-y-2 text-sm text-orange-700">
                <li>• Focus on Credit Card debt first (18.9% interest rate)</li>
                <li>• Consider debt consolidation for better rates</li>
                <li>• Potential savings: $2,400/year with optimization</li>
                <li>• Estimated debt-free date: March 2027</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Recommended Actions:</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Avalanche Method</p>
                  <p className="text-sm text-gray-600">Pay minimums on all debts, extra on highest interest rate</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Balance Transfer</p>
                  <p className="text-sm text-gray-600">Move credit card debt to 0% APR card if qualified</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Extra Payments</p>
                  <p className="text-sm text-gray-600">Add $200/month extra to accelerate payoff</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Strategy Insights */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Savings & Investment Strategy</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-2">Current Savings Rate: {savingsRate}%</h4>
              <p className="text-sm text-green-700">
                Good progress! Recommended rate is 20%. You're currently saving ${((data.totalIncome - data.totalExpenses) / 12).toFixed(0)}/month.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Optimization Opportunities:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Increase 401(k) to get full employer match</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Open high-yield savings account (2.5% vs 0.1%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Consider index fund investments for long-term goals</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recommended Asset Allocation:</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Emergency Fund (3-6 months)</span>
                <span className="text-sm text-green-600 font-semibold">$18,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Retirement (401k/IRA)</span>
                <span className="text-sm text-blue-600 font-semibold">15% of income</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Index Funds</span>
                <span className="text-sm text-purple-600 font-semibold">60% stocks</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Bonds</span>
                <span className="text-sm text-orange-600 font-semibold">40% bonds</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Optimization Insights */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Budget Optimization</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Spending Analysis:</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-700">Housing (38%)</span>
                <span className="text-sm font-semibold text-red-600">Above recommended 30%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-700">Transportation (12%)</span>
                <span className="text-sm font-semibold text-green-600">Within recommended range</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm text-yellow-700">Entertainment (6%)</span>
                <span className="text-sm font-semibold text-yellow-600">Room for optimization</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Optimization Suggestions:</h4>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">Reduce Housing Costs</p>
                <p className="text-sm text-gray-600">Consider refinancing or finding a roommate. Potential savings: $300/month</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">Optimize Subscriptions</p>
                <p className="text-sm text-gray-600">Cancel unused subscriptions and negotiate better rates. Potential savings: $80/month</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">Meal Planning</p>
                <p className="text-sm text-gray-600">Reduce dining out and plan meals. Potential savings: $150/month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};