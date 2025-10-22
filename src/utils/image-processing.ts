/**
 * Image processing utilities (SVG optimization, format conversion)
 */

import sharp from 'sharp';
import { optimize } from 'svgo';
import fs from 'fs/promises';

/**
 * Optimize SVG file
 */
export async function optimizeSVG(svgPath: string): Promise<void> {
  try {
    const svgContent = await fs.readFile(svgPath, 'utf-8');
    const result = optimize(svgContent, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
      ],
    });

    await fs.writeFile(svgPath, result.data);
  } catch (error) {
    console.warn('SVG optimization failed:', error);
    // Don't throw - optimization is optional
  }
}

/**
 * Convert image to specified format
 */
export async function convertImage(
  inputPath: string,
  outputPath: string,
  format: string
): Promise<void> {
  const image = sharp(inputPath);

  switch (format.toLowerCase()) {
    case 'png':
      await image.png().toFile(outputPath);
      break;
    case 'jpg':
    case 'jpeg':
      await image.jpeg({ quality: 90 }).toFile(outputPath);
      break;
    case 'webp':
      await image.webp({ quality: 90 }).toFile(outputPath);
      break;
    default:
      throw new Error(`Unsupported conversion format: ${format}`);
  }
}
