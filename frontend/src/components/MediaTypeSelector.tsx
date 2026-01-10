import React from 'react';
import { MediaType } from '../types';
import { categories } from '../config/categories';

interface MediaTypeSelectorProps {
  selectedCategory: string;
  selectedMediaType: MediaType;
  onMediaTypeChange: (mediaType: MediaType) => void;
}

export default function MediaTypeSelector({ 
  selectedCategory, 
  selectedMediaType, 
  onMediaTypeChange 
}: MediaTypeSelectorProps) {
  const category = categories.find(c => c.id === selectedCategory);
  
  if (!category?.hasMediaType || !category.mediaTypes) {
    return null;
  }

  return (
    <div className="mb-6 animate-in slide-in-from-left-4 duration-500">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Media Type
      </label>
      <div className="flex gap-3">
        {category.mediaTypes.map((type, index) => (
          <label
            key={type.value}
            className="flex items-center cursor-pointer animate-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <input
              type="radio"
              name="mediaType"
              value={type.value}
              checked={selectedMediaType === type.value}
              onChange={(e) => onMediaTypeChange(e.target.value as MediaType)}
              className="sr-only"
            />
            <div className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm hover:scale-105 ${
              selectedMediaType === type.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-800'
            }`}>
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                selectedMediaType === type.value
                  ? 'border-blue-500 bg-blue-500 scale-110'
                  : 'border-gray-300 dark:border-gray-500'
              }`}>
                {selectedMediaType === type.value && (
                  <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-200"></div>
                )}
              </div>
              <span className="font-medium">{type.label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}