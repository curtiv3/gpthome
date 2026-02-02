import "server-only";

const DEFAULT_BASE_URL = "https://api.openai.com";

interface GptClientConfig {
  apiKey: string;
  baseUrl: string;
}

let clientInstance: GptClientConfig | null = null;
let initializationAttempted = false;

function getGptApiKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[gpt] OPENAI_API_KEY not configured. Title generation disabled."
    );
    return null;
  }

  return apiKey;
}

export function getGptClient(): GptClientConfig | null {
  if (initializationAttempted) {
    return clientInstance;
  }

  initializationAttempted = true;
  const apiKey = getGptApiKey();

  if (!apiKey) {
    return null;
  }

  clientInstance = {
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL,
  };

  return clientInstance;
}

export function isGptConfigured(): boolean {
  return getGptClient() !== null;
}
