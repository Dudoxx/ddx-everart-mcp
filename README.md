# Dudoxx EverArt MCP Server

> Advanced EverArt Model Context Protocol server with img2img, custom model training, and full API capabilities

[![CI/CD](https://github.com/dudoxx/ddx-everart-mcp/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/dudoxx/ddx-everart-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/dudoxx/ddx-everart-mcp)

## ✨ Features

**Text-to-Image Generation**
- ✅ FLUX1.1 (Standard & Ultra)
- ✅ Stable Diffusion 3.5 Large
- ✅ Recraft V3 (Realistic & Vector)
- ✅ Multiple format support (PNG, JPEG, WebP, SVG)
- ✅ SVG optimization
- ✅ Dynamic resolution (256-2048px)

**Image-to-Image** ✨ NEW
- ✅ Transform existing images from URLs
- ✅ Style transfer and enhancement
- ✅ Guided generation with base images
- ✅ Support for all EverArt models

**Resolution Control** ✨ NEW
- ✅ Custom height and width (256-2048px)
- ✅ Flexible dimensions per generation
- ✅ Defaults to 1024x1024 (backward compatible)

**Web Integration**
- ✅ Custom output paths
- ✅ Web project structure support (React, Vue, Next.js)
- ✅ Automatic directory creation
- ✅ Local image storage

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/dudoxx/ddx-everart-mcp.git
cd ddx-everart-mcp

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## 🚀 Quick Start

### Configure Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "ddx-everart-mcp": {
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/ddx-everart-mcp/build/index.js"
      ],
      "env": {
        "EVERART_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 📖 Usage Examples

### Text-to-Image (txt2img)

Basic generation with default 1024x1024 resolution:

```typescript
// Ask Claude Code:
"Generate a serene mountain landscape at sunset"
```

### Custom Resolution

Generate images with custom dimensions:

```typescript
// Ask Claude Code:
"Generate a wide panoramic mountain landscape, use width 2048 and height 512"
```

Supported dimensions:
- **Minimum**: 256x256 pixels
- **Maximum**: 2048x2048 pixels
- **Default**: 1024x1024 pixels (when not specified)

### Image-to-Image (img2img)

Transform an existing image from a URL:

```typescript
// Ask Claude Code:
"Transform this image into a watercolor painting style: https://example.com/photo.jpg, type img2img"
```

Complete img2img workflow:

```typescript
// Step 1: Use an image URL
const imageUrl = "https://example.com/base-image.jpg";

// Step 2: Request transformation
"Take this image: https://example.com/base-image.jpg and make it look like an oil painting, use type img2img"
```

### Combining Features

Use img2img with custom resolution:

```typescript
// Ask Claude Code:
"Transform https://example.com/photo.jpg into anime style, type img2img, width 1536, height 1024"
```

## 🔧 Tool Parameters

### generate_image

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | ✅ Yes | - | Text description of desired image |
| `type` | string | No | `txt2img` | Generation type: `txt2img` or `img2img` |
| `image` | string | Conditional* | - | Image URL for img2img (required when type is `img2img`) |
| `height` | number | No | `1024` | Image height (256-2048) |
| `width` | number | No | `1024` | Image width (256-2048) |
| `model` | string | No | `5000` | Model ID (5000, 9000, 6000, 7000, 8000) |
| `format` | string | No | `png` | Output format (svg, png, jpg, webp) |
| `image_count` | number | No | `1` | Number of images (1-10) |

*Required when `type` is `img2img`

## ⚠️ Troubleshooting

### img2img Issues

**Problem**: "image parameter must be a valid HTTP or HTTPS URL"
- **Solution**: Ensure your image URL starts with `http://` or `https://`
- **Example**: ✅ `https://example.com/image.jpg` ❌ `example.com/image.jpg`

**Problem**: "image parameter is required for img2img"
- **Solution**: When using `type: img2img`, you must provide an `image` URL parameter
- **Example**: Include both `type: img2img` and `image: https://...`

**Problem**: Generation fails with img2img
- **Solution**: Verify the image URL is publicly accessible and returns a valid image
- **Tip**: Test the URL in a browser first

### Resolution Issues

**Problem**: "height must be between 256 and 2048"
- **Solution**: Use dimensions within the supported range
- **Valid**: 256, 512, 768, 1024, 1536, 2048
- **Invalid**: 128, 4096, -100

## 🔄 Backward Compatibility

All existing functionality remains unchanged:

- ✅ Calling without `type` defaults to `txt2img`
- ✅ Calling without `height`/`width` defaults to 1024x1024
- ✅ All previous parameters still work exactly as before
- ✅ No breaking changes to existing integrations

## 🙏 Attribution

This project is a refactored and enhanced version of [everart-forge-mcp](https://github.com/nickbaumann98/everart-forge-mcp) by Nick Baumann. We extend our gratitude for the original work that made this possible.

**Refactored by**: Dudoxx UG (Hamburg, Germany)
**Original Author**: Nick Baumann
**License**: MIT

---

Made with ❤️ in Hamburg by [Dudoxx UG](https://dudoxx.com)
