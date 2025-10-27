
import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-700/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-200">{message}</p>
    </div>
  );
};

export default Loader;
