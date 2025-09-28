import React from 'react';
import { ArrowDown, Zap, Target, TrendingUp, Users } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Multi-Agent Financial Coaching
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Transform Your
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Financial Future
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            Upload your financial documents and let our specialized AI agents analyze your situation, 
            create personalized strategies, and guide you toward financial success.
          </p>
          
          {/* CTA */}
          <div className="mb-16">
            <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              Get Started - Upload Your Documents
              <ArrowDown className="w-5 h-5 ml-2" />
            </button>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Debt Analysis Agent</h3>
              <p className="text-gray-600">AI-powered debt analysis with optimized payoff strategies and consolidation recommendations.</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Savings Strategy Agent</h3>
              <p className="text-gray-600">Personalized savings plans, investment recommendations, and goal tracking.</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Optimization Agent</h3>
              <p className="text-gray-600">Smart budget creation, expense categorization, and actionable spending insights.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};