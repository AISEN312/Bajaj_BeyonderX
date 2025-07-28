
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
// This is a critical step for authentication.
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

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
      },
    });

    const responseText = response.text.trim();
    if (!responseText) {
      console.error("Gemini API returned an empty response.");
      return null;
    }

    const parsedResponse = JSON.parse(responseText);
    
    if (parsedResponse && Array.isArray(parsedResponse.answers)) {
      return parsedResponse.answers;
    } else {
      console.error("Parsed response is not in the expected format:", parsedResponse);
      return null;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
