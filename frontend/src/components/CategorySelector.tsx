import React from 'react';
import { Platform } from '../types';
import { categories } from '../config/categories';
import PlatformIcon from './PlatformIcon';

interface CategorySelectorProps {
  selectedCategory: Platform | null;
  onCategorySelect: (category: Platform) => void;
}

export default function CategorySelector({ selectedCategory, onCategorySelect }: CategorySelectorProps) {
  return (
    <div className="mb-8 animate-in slide-in-from-bottom-6 duration-700 delay-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
        Choose Platform
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-500 group backdrop-blur-sm hover:backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 ${
              selectedCategory === category.id
                ? `border-transparent bg-gradient-to-br ${category.color} text-white shadow-2xl scale-105 shadow-current/25`
                : 'border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl hover:scale-105 hover:-translate-y-1'
            }`}
            style={{ animationDelay: `${900 + index * 100}ms` }}
          >
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-300 group-hover:scale-110 ${
                selectedCategory === category.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
              }`}>
                <PlatformIcon 
                  platform={category.id} 
                  className={`w-8 h-8 ${
                    selectedCategory === category.id 
                      ? 'text-white' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`} 
                />
              </div>
              <h3 className={`font-semibold text-lg mb-1 ${
                selectedCategory === category.id ? 'text-white' : 'text-gray-800 dark:text-white'
              }`}>
                {category.name}
              </h3>
              <p className={`text-sm ${
                selectedCategory === category.id ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {category.description}
              </p>
            </div>
            
            {selectedCategory === category.id && (
              <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm animate-in fade-in duration-300"></div>
            )}
            
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
          </button>
        ))}
      </div>
    </div>
  );
}