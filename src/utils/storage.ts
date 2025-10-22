/**
 * Local image storage utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.join(__dirname, '..', '..', 'images');

/**
 * Get the storage directory path
 */
export function getStorageDir(): string {
  return STORAGE_DIR;
}

/**
 * Ensure the storage directory exists
 */
export async function ensureStorageDir(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
    throw error;
  }
}

/**
 * List all stored images
 */
export async function listStoredImages(): Promise<string[]> {
  try {
    await ensureStorageDir();
    const files = await fs.readdir(STORAGE_DIR);
    return files.filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  } catch (error) {
    console.error('Error listing stored images:', error);
    return [];
  }
}

/**
 * Generate a unique filename for an image
 */
export function generateImageFilename(format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `everart-${timestamp}.${format}`;
}

/**
 * Determine web project asset path based on project type
 */
export function getWebProjectAssetPath(
  projectType: string | undefined,
  assetPath: string | undefined
): string {
  if (assetPath) {
    return assetPath;
  }

  // Default paths for common frameworks
  const assetPaths: Record<string, string> = {
    react: 'public/images',
    vue: 'public/images',
    next: 'public/images',
    html: 'images',
    angular: 'src/assets/images',
  };

  return assetPaths[projectType?.toLowerCase() || ''] || 'public/images';
}
