
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
// This is a critical step for authentication.
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Simple in-memory cache for API responses to avoid redundant calls
const responseCache = new Map<string, string[]>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

// Clear expired cache entries
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_EXPIRY) {
      responseCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};

// Generate cache key from document and questions
const generateCacheKey = (documentText: string, questions: string[]): string => {
  const combined = documentText + questions.join('||');
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

/**
 * The response schema tells the Gemini model to return a JSON object 
 * with a specific structure. In this case, we expect an object containing
 * an array of strings, where each string is an answer to a question.
 */
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "The detailed answer to one of the user's questions.",
      },
    },
  },
  required: ['answers'],
};

/**
 * Analyzes the provided document text to answer a list of questions using the Gemini API.
 * Includes caching to avoid redundant API calls for the same document and questions.
 * 
 * @param {string} documentText The full text of the document to be analyzed.
 * @param {string[]} questions An array of questions to be answered based on the document.
 * @returns {Promise<string[] | null>} A promise that resolves to an array of answers, or null if an error occurs.
 */
export const runQueryRetrieval = async (documentText: string, questions: string[]): Promise<string[] | null> => {
  if (!ai) {
    console.error("Gemini AI client is not initialized. Make sure API_KEY is set.");
    throw new Error("Gemini AI client not initialized.");
  }

  // Input validation
  if (!documentText?.trim()) {
    throw new Error("Document text cannot be empty.");
  }
  
  if (!questions?.length) {
    throw new Error("At least one question is required.");
  }

  // Clear expired cache entries periodically
  clearExpiredCache();

  // Check cache first
  const cacheKey = generateCacheKey(documentText, questions);
  const cachedResult = responseCache.get(cacheKey);
  if (cachedResult) {
    console.log("Returning cached result");
    return cachedResult;
  }
  
  // Construct a detailed prompt for the AI model.
  // This prompt guides the model to act as a policy analysis expert and ensures
  // it bases its answers strictly on the provided document text.
  const formattedQuestions = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  const prompt = `
    You are an expert legal and policy analysis AI. Your task is to act as an intelligent query-retrieval system.
    Carefully and thoroughly read the following document text provided below.
    Based *only* on the information contained within this document, answer each of the user's questions.
    Ensure your answers are accurate, concise, and directly reference the information available in the document.
    Do not use any external knowledge. If an answer cannot be found in the document, state that clearly.
    Return your response as a JSON object that matches the required schema. The number of answers in the 'answers' array must exactly match the number of questions asked.

    --- DOCUMENT TEXT START ---
    ${documentText}
    --- DOCUMENT TEXT END ---

    --- QUESTIONS START ---
    ${formattedQuestions}
    --- QUESTIONS END ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Lower temperature for more factual, less creative answers
        maxOutputTokens: 8192, // Optimize token usage
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      console.error("Gemini API returned an empty response.");
      return null;
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      throw new Error("Invalid JSON response from Gemini API.");
    }
    
    if (parsedResponse && Array.isArray(parsedResponse.answers)) {
      // Cache the successful result
      responseCache.set(cacheKey, parsedResponse.answers);
      cacheTimestamps.set(cacheKey, Date.now());
      return parsedResponse.answers;
    } else {
      console.error("Parsed response is not in the expected format:", parsedResponse);
      return null;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error("API quota exceeded. Please try again later.");
      } else if (error.message.includes('unauthorized')) {
        throw new Error("Invalid API key. Please check your API configuration.");
      } else if (error.message.includes('rate limit')) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
      } else {
        throw new Error(`Gemini API Error: ${error.message}`);
      }
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
