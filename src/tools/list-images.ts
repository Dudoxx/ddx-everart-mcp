/**
 * list_images tool handler
 * Lists all stored images in the local storage directory
 */

import path from 'path';
import { listStoredImages } from '../utils/storage.js';

/**
 * Handle list_images tool request
 */
export async function handleListImages(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const files = await listStoredImages();
    if (files.length === 0) {
      return {
        content: [
          { type: 'text', text: 'No stored images found. Try generating some images first!' },
        ],
      };
    }

    // Group files by type for better display
    const filesByType: Record<string, string[]> = {};

    for (const file of files) {
      const ext = path.extname(file).slice(1).toLowerCase();
      if (!filesByType[ext]) {
        filesByType[ext] = [];
      }
      filesByType[ext].push(file);
    }

    let resultText = '📁 Stored images:\n\n';

    for (const [type, typeFiles] of Object.entries(filesByType)) {
      resultText += `${type.toUpperCase()} Files (${typeFiles.length}):\n`;
      resultText += typeFiles.map((f) => `• ${f}`).join('\n');
      resultText += '\n\n';
    }

    resultText += `\nTotal: ${files.length} image${files.length > 1 ? 's' : ''}`;

    return {
      content: [{ type: 'text', text: resultText }],
    };
  } catch (error) {
    console.error('Error listing images:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error listing images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}
