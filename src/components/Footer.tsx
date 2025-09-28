import React from 'react';
import { Heart, Shield, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-gray-600">Built with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">using AI technology</span>
          </div>
          
          <div className="flex items-center justify-center space-x-8 mb-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Real-time Analysis</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            © 2025 RupAI. Your financial data is processed securely and never stored permanently.
          </p>
        </div>
      </div>
    </footer>
  );
};