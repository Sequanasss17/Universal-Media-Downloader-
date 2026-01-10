import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

interface DownloadProgressProps {
  isVisible: boolean;
  stage: 'processing' | 'downloading' | 'complete' | 'error';
  message: string;
  filename?: string;
}

export default function DownloadProgress({ isVisible, stage, message, filename }: DownloadProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage === 'processing') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 85));
      }, 200);
      return () => clearInterval(interval);
    } else if (stage === 'downloading') {
      setProgress(85);
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 5, 95));
      }, 100);
      return () => clearInterval(interval);
    } else if (stage === 'complete') {
      setProgress(100);
    }
  }, [stage]);

  if (!isVisible) return null;

  const getStageIcon = () => {
    switch (stage) {
      case 'processing':
      case 'downloading':
        return <Download className="w-6 h-6 text-blue-500 animate-bounce" />;
      case 'complete':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'processing':
      case 'downloading':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="mb-6">
            {getStageIcon()}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {stage === 'processing' && 'Processing Media'}
            {stage === 'downloading' && 'Downloading File'}
            {stage === 'complete' && 'Download Complete'}
            {stage === 'error' && 'Download Failed'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>

          {filename && stage === 'complete' && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {filename}
              </p>
            </div>
          )}

          {(stage === 'processing' || stage === 'downloading') && (
            <div className="space-y-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${getStageColor()} transition-all duration-300 ease-out rounded-full relative overflow-hidden`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {stage === 'complete' && (
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">File saved successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}