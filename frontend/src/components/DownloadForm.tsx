import React, { useState } from 'react';
import { Download, Link as LinkIcon, FileText } from 'lucide-react';
import { Platform, MediaType, DownloadRequest } from '../types';
import { categories } from '../config/categories';
import MediaTypeSelector from './MediaTypeSelector';
import LoadingSpinner from './LoadingSpinner';
import PlatformIcon from './PlatformIcon';

interface DownloadFormProps {
  selectedCategory: Platform | null;
  onDownload: (request: DownloadRequest) => Promise<void>;
  isLoading: boolean;
}

export default function DownloadForm({ selectedCategory, onDownload, isLoading }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [isUrlValid, setIsUrlValid] = useState(true);

  const selectedCategoryConfig = categories.find(c => c.id === selectedCategory);

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
    
    if (!selectedCategory) {
      return;
    }

    if (!url.trim()) {
      setIsUrlValid(false);
      return;
    }

    if (!validateUrl(url)) {
      setIsUrlValid(false);
      return;
    }

    setIsUrlValid(true);
    
    // Ensure URL has protocol
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const request: DownloadRequest = {
      url: finalUrl,
      platform: selectedCategory,
      filename: filename.trim() || undefined,
    };

    // Add media type for YouTube
    if (selectedCategory === 'youtube') {
      request.media_type = mediaType;
    }

    await onDownload(request);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    
    if (!isUrlValid && value.trim()) {
      setIsUrlValid(true);
    }
  };

  if (!selectedCategory) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-500">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <LinkIcon className="w-16 h-16 mx-auto" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Please select a platform above to continue
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 animate-in slide-in-from-bottom-6 duration-700 delay-1300">
      <div className="text-center mb-6 animate-in slide-in-from-top-4 duration-500">
        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${selectedCategoryConfig?.color} rounded-2xl mb-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}>
          <PlatformIcon platform={selectedCategory} className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Download from {selectedCategoryConfig?.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {selectedCategoryConfig?.description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
        {/* Media Type Selector for YouTube */}
        {selectedCategory === 'youtube' && (
          <MediaTypeSelector
            selectedCategory={selectedCategory}
            selectedMediaType={mediaType}
            onMediaTypeChange={setMediaType}
          />
        )}

        {/* URL Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Media URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300">
              <LinkIcon className={`w-5 h-5 ${isUrlValid ? 'text-gray-400' : 'text-red-400'}`} />
            </div>
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder={selectedCategoryConfig?.placeholder}
              disabled={isLoading}
              className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 backdrop-blur-sm ${
                isUrlValid
                  ? 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 dark:bg-gray-800/80'
                  : 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50/80 dark:bg-red-900/20'
              } ${
                isLoading ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-50' : ''
              }`}
            />
          </div>
          {!isUrlValid && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-left-2 duration-300">
              Please enter a valid URL
            </p>
          )}
        </div>

        {/* Filename Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Save as (optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Custom filename (without extension)"
              disabled={isLoading}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 ${
                isLoading ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-50' : ''
              }`}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave blank to use default filename
          </p>
        </div>

        {/* Download Button */}
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group ${
            isLoading || !url.trim()
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              : `bg-gradient-to-r ${selectedCategoryConfig?.color} hover:${selectedCategoryConfig?.hoverColor} hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg`
          }`}
        >
          {!isLoading && !(!url.trim()) && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          )}
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Download Media</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}