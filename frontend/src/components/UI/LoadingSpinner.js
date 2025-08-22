import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
    </div>
  );
};

// Full screen loading spinner
export const FullScreenLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
    </div>
  );
};

// Inline loading spinner with text
export const InlineLoader = ({ message = 'Loading...', size = 'sm' }) => {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
