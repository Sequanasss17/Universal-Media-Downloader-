import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-6 h-6 border-3 border-transparent border-l-white/50 rounded-full animate-spin animate-reverse"></div>
      </div>
    </div>
  );
}