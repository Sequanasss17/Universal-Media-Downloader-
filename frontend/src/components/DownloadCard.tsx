import React, { useState } from 'react';
import { Download, Link as LinkIcon } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface DownloadCardProps {
  onDownload: (url: string) => Promise<void>;
  isLoading: boolean;
}

export default function DownloadCard({ onDownload, isLoading }: DownloadCardProps) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(true);

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) return false;
    
    try {
      new URL(input);
      return true;
    } catch {
      // Check if it's a valid domain without protocol
      const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]\.[a-zA-Z]{2,}(\/.*)?$/;
      return domainPattern.test(input);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setIsValid(false);
      return;
    }

    if (!validateUrl(url)) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    
    // Ensure URL has protocol
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    await onDownload(finalUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    
    if (!isValid && value.trim()) {
      setIsValid(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Download className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Universal Media Downloader
          </h1>
          <p className="text-gray-600 text-sm">
            Paste any link to download media from Instagram, YouTube, X, Spotify and more
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className={`w-5 h-5 ${isValid ? 'text-gray-400' : 'text-red-400'}`} />
            </div>
            <input
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="https://instagram.com/p/... or youtube.com/watch?v=..."
              disabled={isLoading}
              className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                isValid
                  ? 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              } ${
                isLoading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
              }`}
            />
            {!isValid && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <span>Please enter a valid URL</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
              isLoading || !url.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Media</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Supports Instagram, YouTube, X/Twitter, Spotify, TikTok and many more platforms
          </p>
        </div>
      </div>
    </div>
  );
}