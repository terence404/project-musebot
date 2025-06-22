
import React from 'react';

interface LoadingSpinnerProps {
  sizeClasses?: string; // e.g., "w-10 h-10"
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  sizeClasses = "w-12 h-12", // Default size
}) => {
  // Adjust border thickness based on size for better visual balance
  const isSmallSpinner = sizeClasses.includes("w-5") || sizeClasses.includes("w-6") || sizeClasses.includes("w-8") || sizeClasses.includes("w-10");
  const borderClass = isSmallSpinner ? "border-2" : "border-4";

  return (
    <div className="flex justify-center items-center" role="status" aria-live="polite">
      <div
        className={`${sizeClasses} ${borderClass} border-blue-400 border-t-transparent rounded-full animate-spin`}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
