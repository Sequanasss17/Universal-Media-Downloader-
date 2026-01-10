import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500 max-w-md">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md hover:scale-105 transition-transform duration-300 ${getToastStyles()}`}>
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20 transition-all duration-300 flex-shrink-0 hover:scale-110 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}