
import React, { useState, useCallback } from 'react';
import { QueryResult } from '../types';
import { ChevronDownIcon } from './icons/Icons';

interface ResultsDisplayProps {
  results: QueryResult[];
}

// Memoized ResultsDisplay component
const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ results }) => {
  return (
    <div className="w-full h-full">
      <div className="space-y-4 h-full overflow-y-auto pr-2 smooth-scroll">
        {results.map((result, index) => (
          <ResultItem key={`${result.question}-${index}`} result={result} />
        ))}
      </div>
    </div>
  );
});

ResultsDisplay.displayName = 'ResultsDisplay';

interface ResultItemProps {
  result: QueryResult;
}

// Memoized ResultItem component
const ResultItem: React.FC<ResultItemProps> = React.memo(({ result }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-expanded={isOpen}
        type="button"
      >
        <h3 className="text-md font-semibold text-left text-slate-800 dark:text-slate-100">
          {result.question}
        </h3>
        <ChevronDownIcon
          className={`h-5 w-5 text-slate-500 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {result.answer}
          </p>
        </div>
      )}
    </div>
  );
});

ResultItem.displayName = 'ResultItem';

export default ResultsDisplay;
