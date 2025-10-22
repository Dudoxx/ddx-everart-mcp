/**
 * EverArt API client initialization and types
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const everartModule = require('everart');
const EverArt = everartModule.default || everartModule;

export interface EverArtClient {
  v1: {
    generations: {
      create: (
        model: string,
        prompt: string,
        mode: string,
        options: Record<string, unknown>
      ) => Promise<Array<{ id: string; status: string; image_url?: string }>>;
      fetchWithPolling: (
        generationId: string,
        options?: { maxAttempts?: number; interval?: number }
      ) => Promise<{ id: string; status: string; image_url?: string }>;
    };
  };
}

let client: EverArtClient;

/**
 * Initialize the EverArt client with API key
 */
export function initializeClient(apiKey: string): void {
  console.error('Initializing EverArt client...');
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'EVERART_API_KEY environment variable is required but not set. Please configure your API key in ~/.claude.json'
    );
  }
  client = new EverArt(apiKey);
  console.error('EverArt client initialized successfully');
}

/**
 * Get the initialized EverArt client
 */
export function getClient(): EverArtClient {
  if (!client) {
    throw new Error('EverArt client not initialized. Call initializeClient first.');
  }
  return client;
}
