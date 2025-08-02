import React, { Suspense } from 'react';
import { QueryResult } from '../types';
import { Loader } from './Loader';

// Lazy load the ResultsDisplay component for better performance
const LazyResultsDisplay = React.lazy(() => import('./ResultsDisplay'));

interface OptimizedResultsDisplayProps {
  results: QueryResult[];
}

export const OptimizedResultsDisplay: React.FC<OptimizedResultsDisplayProps> = ({ results }) => {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader />
          <span className="ml-2">Loading results...</span>
        </div>
      }
    >
      <LazyResultsDisplay results={results} />
    </Suspense>
  );
};