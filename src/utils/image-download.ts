/**
 * Image download and fetch utilities
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { EverArtErrorType } from '../types.js';
import type { EverArtError } from './error-handler.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Downloads an image from a URL with retry logic
 */
export async function downloadImageWithRetry(imageUrl: string, outputPath: string): Promise<void> {
  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Fetch the image with retries
  let response;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      // @ts-expect-error - node-fetch doesn't support timeout in RequestInit, but this works at runtime
      response = await fetch(imageUrl, { timeout: 30000 });
      if (response.ok) break;

      // If we got a 429 (rate limit), wait longer before retrying
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY * retryCount));
    }
  }

  if (!response || !response.ok) {
    const error: EverArtError = {
      type: EverArtErrorType.NETWORK_ERROR,
      message: `Failed to download image after ${MAX_RETRIES} attempts`,
      details: { url: imageUrl, status: response?.status },
    };
    throw error;
  }

  // Write the image to disk
  const buffer = await response.buffer();
  await fs.writeFile(outputPath, buffer);
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
