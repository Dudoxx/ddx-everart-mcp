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

**Image-to-Image** (Coming Soon)
- 🔄 Transform existing images
- 🔄 Style transfer
- 🔄 Image enhancement
- 🔄 Guided generation

**Custom Model Training** (Coming Soon)
- 🔄 Train on your own images
- 🔄 Brand-specific content
- 🔄 Person, object, or style models
- 🔄 Model management

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

## 🙏 Attribution

This project is a refactored and enhanced version of [everart-forge-mcp](https://github.com/nickbaumann98/everart-forge-mcp) by Nick Baumann. We extend our gratitude for the original work that made this possible.

**Refactored by**: Dudoxx UG (Hamburg, Germany)
**Original Author**: Nick Baumann
**License**: MIT

---

Made with ❤️ in Hamburg by [Dudoxx UG](https://dudoxx.com)
