/**
 * generate_image tool handler
 * Generates images using EverArt API with support for txt2img and img2img
 */

import fs from 'fs/promises';
import path from 'path';
import open from 'open';
import { EverArtErrorType, VALIDATION } from '../types.js';
import { errorResponse } from '../utils/error-handler.js';
import { getClient } from '../utils/everart-client.js';
import { downloadImageWithRetry } from '../utils/image-download.js';
import {
  getStorageDir,
  ensureStorageDir,
  generateImageFilename,
  getWebProjectAssetPath,
} from '../utils/storage.js';
import { optimizeSVG, convertImage } from '../utils/image-processing.js';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const MODEL_NAMES: Record<string, string> = {
  '5000': 'FLUX1.1 (Standard quality)',
  '9000': 'FLUX1.1-ultra (Ultra high quality)',
  '6000': 'Stable Diffusion 3.5',
  '7000': 'Recraft-Real (Photorealistic)',
  '8000': 'Recraft-Vector (Vector art)',
};

/**
 * Validate model/format compatibility
 */
function validateModelFormatCompatibility(model: string, format: string): boolean {
  // SVG is only available for Recraft-Vector (8000)
  if (format.toLowerCase() === 'svg' && model !== '8000') {
    return false;
  }
  return true;
}

/**
 * Save image to local storage or specified path
 */
async function saveImage(
  imgUrl: string,
  prompt: string,
  model: string,
  format: string,
  output_path: string | undefined,
  web_project_path: string | undefined,
  project_type: string | undefined,
  asset_path: string | undefined
): Promise<string> {
  await ensureStorageDir();

  const filename = generateImageFilename(format);

  let targetDir: string;
  let filepath: string;

  if (output_path) {
    // Use specified output path
    targetDir = path.dirname(output_path);
    filepath = output_path;
  } else if (web_project_path) {
    // Save to web project structure
    const assetSubPath = getWebProjectAssetPath(project_type, asset_path);
    targetDir = path.join(web_project_path, assetSubPath);
    filepath = path.join(targetDir, filename);
  } else {
    // Default: save to images directory
    targetDir = getStorageDir();
    filepath = path.join(targetDir, filename);
  }

  // Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // Download the image
  await downloadImageWithRetry(imgUrl, filepath);

  // Post-process based on format
  if (format.toLowerCase() === 'svg') {
    await optimizeSVG(filepath);
  } else if (format.toLowerCase() !== 'png') {
    // For non-PNG raster formats, convert from the downloaded format
    const tempPath = filepath + '.tmp.png';
    await fs.rename(filepath, tempPath);
    await convertImage(tempPath, filepath, format);
    await fs.unlink(tempPath);
  }

  return filepath;
}

/**
 * Handle generate_image tool request
 */
export async function handleGenerateImage(args: Record<string, unknown>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    // Validate required parameters
    if (!args.prompt || typeof args.prompt !== 'string' || args.prompt.trim() === '') {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: 'Prompt is required and must be a non-empty string.',
      });
    }

    const prompt = args.prompt as string;
    // Use 'let' instead of 'const' for model since we might need to modify it
    let modelInput = (args.model as string | undefined) || '5000';
    const image_count = typeof args.image_count === 'number' ? args.image_count : 1;
    const output_path = args.output_path as string | undefined;
    const web_project_path = args.web_project_path as string | undefined;
    const project_type = args.project_type as string | undefined;
    const asset_path = args.asset_path as string | undefined;

    // Extract and validate height/width parameters
    const height = typeof args.height === 'number' ? args.height : VALIDATION.DEFAULT_DIMENSION;
    const width = typeof args.width === 'number' ? args.width : VALIDATION.DEFAULT_DIMENSION;

    // Extract type and image parameters for img2img support
    const type = (args.type as string | undefined) || 'txt2img';
    const image = args.image as string | undefined;

    // Enhanced validation
    if (image_count < 1 || image_count > 10) {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: 'image_count must be between 1 and 10',
      });
    }

    // Validate dimensions
    if (height < VALIDATION.MIN_DIMENSION || height > VALIDATION.MAX_DIMENSION) {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: `height must be between ${VALIDATION.MIN_DIMENSION} and ${VALIDATION.MAX_DIMENSION}`,
      });
    }

    if (width < VALIDATION.MIN_DIMENSION || width > VALIDATION.MAX_DIMENSION) {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: `width must be between ${VALIDATION.MIN_DIMENSION} and ${VALIDATION.MAX_DIMENSION}`,
      });
    }

    // Validate type parameter
    if (type !== 'txt2img' && type !== 'img2img') {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: `type must be 'txt2img' or 'img2img', got: ${type}`,
      });
    }

    // Validate img2img requirements
    if (type === 'img2img') {
      if (!image || typeof image !== 'string') {
        return errorResponse({
          type: EverArtErrorType.VALIDATION_ERROR,
          message: 'image parameter is required for img2img and must be a string (URL)',
        });
      }

      // Validate that image is a URL
      const isValidUrl = image.startsWith('http://') || image.startsWith('https://');
      if (!isValidUrl) {
        return errorResponse({
          type: EverArtErrorType.VALIDATION_ERROR,
          message: 'image parameter must be a valid HTTP or HTTPS URL for img2img',
        });
      }
    }

    // Validate model - extract the numeric ID if a combined format was provided
    const validModels = ['5000', '6000', '7000', '8000', '9000'];

    // Handle model IDs in the format "8000:Recraft-Vector"
    if (modelInput.includes(':')) {
      const originalModel = modelInput;
      modelInput = modelInput.split(':')[0];
      console.log(
        `Received combined model ID format: ${originalModel}, using base ID: ${modelInput}`
      );
    }

    if (!validModels.includes(modelInput)) {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: `Invalid model ID: ${modelInput}. Valid models are: ${validModels.join(', ')}`,
      });
    }

    // Now we have the validated model ID
    const format = (args.format as string | undefined) || (modelInput === '8000' ? 'svg' : 'png');

    // Validate format
    const supportedFormats = ['svg', 'png', 'jpg', 'jpeg', 'webp'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: `Unsupported format: ${format}. Supported formats are: ${supportedFormats.join(', ')}`,
      });
    }

    // Validate model/format compatibility
    if (!validateModelFormatCompatibility(modelInput, format)) {
      return errorResponse({
        type: EverArtErrorType.VALIDATION_ERROR,
        message: `Format '${format}' is not compatible with model '${modelInput}'. SVG format is only available with Recraft-Vector (8000) model.`,
      });
    }

    // Get EverArt client
    const client = getClient();

    // Generate image with retry logic
    let generation;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        generation = await client.v1.generations.create(modelInput, prompt, type, {
          imageCount: image_count,
          height: height,
          width: width,
          ...(image ? { image: image } : {}),
          // Add extra fields for specific models if needed
          ...(modelInput === '8000' ? { variant: 'vector' } : {}),
        });
        break;
      } catch (error) {
        if (retryCount >= MAX_RETRIES - 1) throw error;

        // Exponential backoff
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise((r) => setTimeout(r, delay));
        retryCount++;
      }
    }

    if (!generation) {
      throw new Error('Failed to create generation after multiple attempts');
    }

    // Enhanced polling with better timeout handling
    const completedGen = await client.v1.generations.fetchWithPolling(generation[0].id, {
      maxAttempts: 30, // Increased from default
      interval: 3000, // Check every 3 seconds
    });

    const imgUrl = completedGen.image_url;
    if (!imgUrl) {
      throw new Error('No image URL in the completed generation');
    }

    // Save image locally with specified format and path
    const filepath = await saveImage(
      imgUrl,
      prompt,
      modelInput,
      format,
      output_path,
      web_project_path,
      project_type,
      asset_path
    );

    // Open in default viewer
    try {
      await open(filepath);
    } catch (openError) {
      console.warn('Could not open the image in default viewer:', openError);
      // Continue without throwing - this is a non-critical error
    }

    // Read the image file for inline display (for future use)
    let _imageData: string | undefined;
    try {
      const imageContent = await fs.readFile(filepath);
      _imageData = imageContent.toString('base64');
    } catch (error) {
      console.warn('Unable to read image for inline display:', error);
      // Continue without inline display if reading fails
    }

    // Calculate relative web path if applicable
    let webRelativePath: string | undefined;
    if (web_project_path && filepath.startsWith(web_project_path)) {
      webRelativePath = filepath.slice(web_project_path.length);
      if (!webRelativePath.startsWith('/')) webRelativePath = '/' + webRelativePath;
    }

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Image generated and saved successfully!\n\n` +
            `Generation details:\n` +
            `• Model: ${MODEL_NAMES[modelInput] || modelInput}\n` +
            `• Prompt: "${prompt}"\n` +
            `• Format: ${format.toUpperCase()}\n` +
            `• Saved to: ${filepath}` +
            (webRelativePath ? `\n• Web relative path: ${webRelativePath}` : ``),
        },
        {
          type: 'text',
          text: `View the image at: file://${filepath}`,
        },
      ],
    };
  } catch (error: unknown) {
    console.error('Detailed error:', error);

    // Categorize errors for better user feedback
    if (error instanceof Error) {
      if (error.message.includes('SVG format')) {
        return errorResponse({
          type: EverArtErrorType.FORMAT_ERROR,
          message: error.message,
        });
      } else if (error.message.includes('Failed to fetch image')) {
        return errorResponse({
          type: EverArtErrorType.NETWORK_ERROR,
          message:
            'Failed to download the generated image. Please check your internet connection and try again.',
        });
      } else if (error.message.includes('rate limit')) {
        return errorResponse({
          type: EverArtErrorType.API_ERROR,
          message: 'EverArt API rate limit reached. Please try again later.',
        });
      } else if (
        error.message.includes('unauthorized') ||
        error.message.includes('authentication')
      ) {
        return errorResponse({
          type: EverArtErrorType.AUTHENTICATION_ERROR,
          message: 'API authentication failed. Please check your EverArt API key.',
        });
      }
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse({
      type: EverArtErrorType.UNKNOWN_ERROR,
      message: errorMessage,
    });
  }
}
