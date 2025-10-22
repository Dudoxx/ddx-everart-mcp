/**
 * view_image tool handler
 * Opens a stored image in the default image viewer
 */

import fs from 'fs/promises';
import path from 'path';
import open from 'open';
import { EverArtErrorType } from '../types.js';
import { errorResponse } from '../utils/error-handler.js';
import { getStorageDir, listStoredImages } from '../utils/storage.js';
import { getMimeType } from '../utils/image-download.js';

/**
 * Handle view_image tool request
 */
export async function handleViewImage(args: Record<string, unknown>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    // Validate filename
    if (!args.filename || typeof args.filename !== 'string') {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: 'filename is required and must be a string',
      });
    }

    const filename = args.filename;
    const filepath = path.join(getStorageDir(), filename);

    try {
      // Check if file exists
      await fs.access(filepath);
    } catch {
      // List available files to help the user
      const availableFiles = await listStoredImages();
      let errorMsg = `Image not found: ${filename}`;

      if (availableFiles.length > 0) {
        const suggestions = availableFiles
          .filter(
            (f) =>
              f.toLowerCase().includes(filename.toLowerCase()) ||
              filename.toLowerCase().includes(f.toLowerCase().split('_').pop() || '')
          )
          .slice(0, 3);

        if (suggestions.length > 0) {
          errorMsg +=
            `\n\nDid you mean one of these?\n` + suggestions.map((s) => `• ${s}`).join('\n');
        }

        errorMsg += `\n\nUse 'list_images' to see all available images.`;
      }

      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: errorMsg,
      });
    }

    // Read the image for inline display (for future use)
    let _imageData: string | undefined;
    let _mimeType: string = 'application/octet-stream';

    try {
      const content = await fs.readFile(filepath);
      _imageData = content.toString('base64');
      const ext = path.extname(filename).slice(1).toLowerCase();
      _mimeType = getMimeType(ext);
    } catch (error) {
      console.warn('Unable to read image for inline display:', error);
      // Continue without inline display if reading fails
    }

    await open(filepath);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Viewing image: ${filename}`,
        },
        {
          type: 'text',
          text: `Image opened in default viewer.\nFile path: file://${filepath}`,
        },
      ],
    };
  } catch (error) {
    console.error('Error viewing image:', error);
    return errorResponse({
      type: EverArtErrorType.UNKNOWN_ERROR,
      message: error instanceof Error ? error.message : 'Failed to view image',
    });
  }
}
