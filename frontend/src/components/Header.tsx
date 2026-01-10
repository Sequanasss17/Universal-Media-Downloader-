import React from 'react';
import { Download, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Header({ showBackButton, onBack }: HeaderProps) {
  return (
    <header className="text-center mb-8 animate-in slide-in-from-top-4 duration-700">
      
      {showBackButton && (
        <button
          onClick={onBack}
          className="fixed top-8 left-4 z-50 group inline-flex items-center px-4 py-2 
                     text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white 
                     transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to Home</span>
        </button>
      )}

      <div className="inline-flex items-center justify-center w-20 h-20 
                      bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 
                      shadow-2xl hover:shadow-3xl transition-all duration-300 
                      hover:scale-110 animate-in zoom-in duration-500 delay-200">
        <Download className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3 
                     bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent 
                     animate-in slide-in-from-bottom-4 duration-700 delay-300">
         Media Downloader
      </h1>

      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed 
                    animate-in slide-in-from-bottom-4 duration-700 delay-500">
        Download media from your favorite platforms with ease. 
        Choose your platform, paste the link, and get your content instantly.
      </p>
    </header>
  );
}
