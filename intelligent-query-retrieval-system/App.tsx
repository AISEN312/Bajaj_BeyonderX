
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueryResult } from './types';
import { runQueryRetrieval } from './services/geminiService';
import { DEFAULT_QUESTIONS, DOCUMENT_PLACEHOLDER } from './constants';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import { SparklesIcon, DocumentTextIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './components/icons/Icons';

// Memoized component for better performance
const App: React.FC = React.memo(() => {
  const [documentText, setDocumentText] = useState<string>('');
  const [questions, setQuestions] = useState<string>(DEFAULT_QUESTIONS);
  const [results, setResults] = useState<QueryResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);

  // Memoize API key check to avoid repeated checks
  const apiKeyStatus = useMemo(() => {
    return !!process.env.API_KEY;
  }, []);

  useEffect(() => {
    if (!apiKeyStatus) {
      setIsApiKeyMissing(true);
      setError("API Key is missing. Please set the API_KEY environment variable.");
    } else {
      setIsApiKeyMissing(false);
      setError(null);
    }
  }, [apiKeyStatus]);

  // Memoize processed questions to avoid repeated processing
  const processedQuestions = useMemo(() => {
    return questions.split('\n').filter(q => q.trim() !== '');
  }, [questions]);

  // Memoize validation state
  const isFormValid = useMemo(() => {
    return !isApiKeyMissing && documentText.trim() !== '' && processedQuestions.length > 0;
  }, [isApiKeyMissing, documentText, processedQuestions]);

  const handleAnalyze = useCallback(async () => {
    if (!isFormValid) {
      setError("Please provide the document text, at least one question, and ensure the API key is configured.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const answers = await runQueryRetrieval(documentText, processedQuestions);
      if (answers) {
        const queryResults: QueryResult[] = processedQuestions.map((question, index) => ({
          question,
          answer: answers[index] || "No answer found.",
        }));
        setResults(queryResults);
      } else {
         setError("The model did not return a valid response. The document might be too complex or the query too ambiguous. Please try again with a clearer document or questions.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to retrieve answers. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [documentText, processedQuestions, isFormValid]);

  // Memoized handlers for inputs
  const handleDocumentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDocumentText(e.target.value);
  }, []);

  const handleQuestionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestions(e.target.value);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Intelligent Query-Retrieval System
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {isApiKeyMissing && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
              <strong className="font-bold">Configuration Error:</strong>
              <span className="block sm:inline ml-2">API_KEY environment variable is not set.</span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <InformationCircleIcon className="h-6 w-6 mt-0.5 flex-shrink-0" />
            <p>
                This app uses the Gemini API to analyze document text. Since frontend apps cannot directly read local files or URLs securely, please <strong>copy the text from your document</strong> and paste it into the input field below.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-sky-500" />
                1. Provide Document Text
              </h2>
              <textarea
                value={documentText}
                onChange={handleDocumentChange}
                placeholder={DOCUMENT_PLACEHOLDER}
                className="w-full h-64 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out resize-y"
                disabled={isLoading}
              />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-6 w-6 text-sky-500" />
                2. Ask Questions
              </h2>
              <textarea
                value={questions}
                onChange={handleQuestionsChange}
                placeholder="Enter one question per line..."
                className="w-full h-64 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out resize-y"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <Loader />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Analyze Document
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 min-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Analysis Results</h2>
            <div className="flex-grow flex items-center justify-center">
              {isLoading ? (
                <div className="text-center">
                  <Loader />
                  <p className="mt-4 text-lg">Processing your request...</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">An Error Occurred</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : results ? (
                <ResultsDisplay results={results} />
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <p>Your analysis results will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <footer className="text-center mt-12 py-4 text-sm text-slate-500 dark:text-slate-400">
            <p>Powered by Gemini API</p>
        </footer>
      </main>
    </div>
  );
});

// Set display name for debugging
App.displayName = 'App';

export default App;
