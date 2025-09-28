import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Target, CreditCard, PiggyBank, AlertTriangle } from 'lucide-react';
import type { FinancialData } from '../App';

interface DashboardProps {
  data: FinancialData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const financialHealthScore = Math.round(
    ((data.totalSavings / data.totalIncome) * 30) +
    ((data.totalIncome - data.totalExpenses) / data.totalIncome * 40) +
    (data.creditScore / 850 * 30)
  );

  return (
    <div className="space-y-8">
      {/* Financial Health Score */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-700 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Financial Health Score</h2>
            <p className="text-yellow-100">Based on your income, expenses, debts, and savings</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">{financialHealthScore}</div>
            <div className="text-sm text-yellow-200">out of 100</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
              financialHealthScore >= 80 ? 'bg-green-500 text-white' :
              financialHealthScore >= 60 ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {financialHealthScore >= 80 ? 'Excellent' :
               financialHealthScore >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-700" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${data.totalIncome.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Annual Income</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${data.totalExpenses.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Annual Expenses</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${data.totalDebt.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Debt</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-yellow-700" />
            </div>
            <TrendingUp className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${data.totalSavings.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Savings</div>
        </div>
      </div>

      {/* Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Expenses Breakdown</h3>
          <div className="space-y-4">
            {data.expenses.map((expense) => (
              <div key={expense.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: expense.category === 'Housing' ? '#3B82F6' :
                                     expense.category === 'Transportation' ? '#EF4444' :
                                     expense.category === 'Food' ? '#10B981' :
                                     expense.category === 'Utilities' ? '#F59E0B' :
                                     expense.category === 'Entertainment' ? '#8B5CF6' :
                                     expense.category === 'Healthcare' ? '#06B6D4' :
                                     '#6B7280'
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{expense.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">${expense.amount}</div>
                  <div className="text-xs text-gray-500">{expense.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt Overview */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Debt Overview</h3>
          <div className="space-y-4">
            {data.debts.map((debt, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900">{debt.type}</h4>
                  <span className="text-lg font-bold text-red-600">${debt.amount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Interest Rate: <span className="font-medium">{debt.interestRate}%</span></div>
                  <div>Min Payment: <span className="font-medium">${debt.minPayment}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Savings Goals Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.savingsGoals.map((goal, index) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>${goal.current.toLocaleString()}</span>
                    <span>${goal.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Target: {new Date(goal.deadline).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};