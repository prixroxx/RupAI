import React from 'react';
import { TrendingUp, Shield, Brain, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  user: User;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-black"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                RupAI
              </h1>
              <p className="text-xs text-gray-400">AI Financial Coach</p>
            </div>
          </div>

          {/* Features */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span>Multi-Agent AI</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-600">
              <span className="text-gray-200">Welcome, {user.user_metadata?.full_name || user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};