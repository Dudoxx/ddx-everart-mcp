#!/usr/bin/env node
/**
 * DDX EverArt MCP Server
 * Refactored for modularity and maintainability
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { VALIDATION } from './types.js';
import { initializeClient } from './utils/everart-client.js';
import { ensureStorageDir } from './utils/storage.js';
import { handleGenerateImage } from './tools/generate-image.js';
import { handleListImages } from './tools/list-images.js';
import { handleViewImage } from './tools/view-image.js';

// API key validation
if (!process.env.EVERART_API_KEY) {
  console.error(
    'ERROR: EVERART_API_KEY environment variable is not set. Please add your EverArt API key to the MCP settings.'
  );
  process.exit(1);
}

// Initialize EverArt client
try {
  initializeClient(process.env.EVERART_API_KEY);
} catch (error) {
  console.error('Failed to initialize EverArt client:', error);
  process.exit(1);
}

// Create MCP server
const server = new Server(
  {
    name: 'everart-forge-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'generate_image',
      description:
        'Generate images using EverArt Models with support for txt2img and img2img. ' +
        'Supports dynamic resolution, web project paths, responsive formats, and inline preview. ' +
        'Available models:\n' +
        '- 5000:FLUX1.1: Standard quality\n' +
        '- 9000:FLUX1.1-ultra: Ultra high quality\n' +
        '- 6000:SD3.5: Stable Diffusion 3.5\n' +
        '- 7000:Recraft-Real: Photorealistic style\n' +
        '- 8000:Recraft-Vector: Vector art style (SVG format)',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Text description of desired image',
          },
          type: {
            type: 'string',
            description:
              "Generation type: 'txt2img' for text-to-image or 'img2img' for image-to-image transformation",
            enum: ['txt2img', 'img2img'],
            default: 'txt2img',
          },
          image: {
            type: 'string',
            description:
              "Image URL for img2img generation (required when type is 'img2img'). Must be a valid HTTP or HTTPS URL.",
          },
          height: {
            type: 'number',
            description: `Image height in pixels (min: ${VALIDATION.MIN_DIMENSION}, max: ${VALIDATION.MAX_DIMENSION}, default: ${VALIDATION.DEFAULT_DIMENSION})`,
            default: VALIDATION.DEFAULT_DIMENSION,
          },
          width: {
            type: 'number',
            description: `Image width in pixels (min: ${VALIDATION.MIN_DIMENSION}, max: ${VALIDATION.MAX_DIMENSION}, default: ${VALIDATION.DEFAULT_DIMENSION})`,
            default: VALIDATION.DEFAULT_DIMENSION,
          },
          model: {
            type: 'string',
            description:
              'Model ID (5000, 9000, 6000, 7000, 8000). Can include name like "8000:Recraft-Vector"',
            default: '5000',
          },
          format: {
            type: 'string',
            description:
              'Output format (svg, png, jpg, webp). Note: SVG only available with Recraft-Vector (8000)',
            enum: ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            default: 'png',
          },
          output_path: {
            type: 'string',
            description: 'Optional: Custom output path for the generated image',
          },
          web_project_path: {
            type: 'string',
            description: 'Path to web project root folder for storing images in appropriate asset directories',
          },
          project_type: {
            type: 'string',
            description: "Web project type to determine appropriate asset directory structure (e.g., 'react', 'vue', 'html', 'next')",
          },
          asset_path: {
            type: 'string',
            description: 'Optional subdirectory within the web project\'s asset structure for storing generated images',
          },
          image_count: {
            type: 'number',
            description: 'Number of images to generate (1-10)',
            default: 1,
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'list_images',
      description: 'List all stored images',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'view_image',
      description: 'Open a stored image in the default image viewer',
      inputSchema: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'Name of the image file to view',
          },
        },
        required: ['filename'],
      },
    },
  ],
}));

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments as Record<string, unknown>;

  switch (request.params.name) {
    case 'generate_image':
      return await handleGenerateImage(args);

    case 'list_images':
      return await handleListImages();

    case 'view_image':
      return await handleViewImage(args);

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Start server
async function main() {
  // Ensure storage directory exists
  await ensureStorageDir();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('EverArt Forge MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
