/**
 * Centralized OpenAI configuration for all agents
 * Handles API key loading for both runtime and tests
 */

import { createOpenAI } from "@ai-sdk/openai";

// Lazy initialization - client is created only when first accessed
let _openaiClient: ReturnType<typeof createOpenAI> | null = null;

/**
 * Get or create OpenAI client instance
 * Uses lazy initialization to ensure API key is loaded from jest setup
 */
function getOpenAIClient() {
  if (!_openaiClient) {
    // Try to load from .env.local if not already loaded (for tests)
    if (!process.env.OPENAI_API_KEY) {
      try {
        require("dotenv").config({
          path: require("path").resolve(process.cwd(), ".env.local"),
        });
      } catch (e) {
        // Ignore if dotenv not available
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Debug logging
    console.log("[OpenAI Config] Initializing client...");
    console.log("  CWD:", process.cwd());
    console.log("  API Key present:", !!apiKey);
    if (apiKey) {
      console.log("  API Key preview:", apiKey.substring(0, 8) + "...");
    }

    _openaiClient = createOpenAI({
      apiKey: apiKey,
    });
  }
  return _openaiClient;
}

/**
 * Get model with standard configuration
 * @param modelName - OpenAI model name (default: gpt-5-mini)
 */
export function getOpenAIModel(modelName: string = "gpt-5-mini") {
  return getOpenAIClient()(modelName);
}
