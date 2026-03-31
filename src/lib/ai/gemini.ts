import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the API key provided by the user, or fallback to environment variable
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC1mTM8NCTkaeqdQFbqOAD4xyFQg6ddId4";

export const genAI = new GoogleGenerativeAI(apiKey);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// For tasks requiring more reasoning:
export const geminiPro = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
