# ddx-everart-mcp Setup Guide

## Project Status: ✅ Ready for Development

The ddx-everart-mcp project has been successfully refactored from everart-forge-mcp and is ready for development with modern tooling and CI/CD.

## 📁 Project Location
```
/Users/optron/projects/sandboxes/dudoxx_realtime_sandbox/ddx-everart-mcp
```

## ✅ Completed Setup

### 1. Project Structure
- ✅ Copied from everart-forge-mcp
- ✅ Removed original .git directory
- ✅ Initialized new git repository
- ✅ Rebranded to @dudoxx/everart-mcp

### 2. Package Configuration
- ✅ Updated package.json with Dudoxx branding
- ✅ Added attribution to original author (Nick Baumann)
- ✅ Configured modern scripts (lint, test, version, changelog)
- ✅ Added build metadata tracking

### 3. Development Tooling
- ✅ ESLint with TypeScript support (eslint.config.mjs)
- ✅ Prettier for code formatting (.prettierrc)
- ✅ Jest for testing (jest.config.js)
- ✅ Husky for git hooks (prepare script)
- ✅ lint-staged for pre-commit checks

### 4. CI/CD Pipeline
- ✅ GitHub Actions workflow (.github/workflows/ci.yml)
  - Lint checking
  - TypeScript validation
  - Test execution with coverage
  - Build verification
  - Artifact archiving

### 5. Version Management
- ✅ Automated version bumping (scripts/version-manager.mjs)
- ✅ Changelog generation (scripts/update-changelog.mjs)
- ✅ Build count tracking
- ✅ Release automation

### 6. Documentation
- ✅ Comprehensive README.md
- ✅ CHANGELOG.md with attribution
- ✅ .gitignore for Node.js projects
- ✅ Original author attribution preserved

## 🚀 Next Steps

### 1. Install Dependencies
```bash
cd /Users/optron/projects/sandboxes/dudoxx_realtime_sandbox/ddx-everart-mcp
pnpm install
```

### 2. Initialize Husky
```bash
pnpm run prepare
```

### 3. Build the Project
```bash
pnpm run build
```

### 4. Run Tests
```bash
pnpm run test
```

### 5. Local Development
```bash
# Start dev mode with watch
pnpm run dev

# In another terminal, test the MCP server
node build/index.js
```

## 🔧 Configuration Required

### Environment Variables
Create `.env` file:
```bash
EVERART_API_KEY=your_api_key_here
```

### Claude Code Integration
Update `~/.claude.json`:
```json
{
  "mcpServers": {
    "ddx-everart-mcp": {
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/optron/projects/sandboxes/dudoxx_realtime_sandbox/ddx-everart-mcp/build/index.js"
      ],
      "env": {
        "EVERART_API_KEY": "everart-D5ZGZW8WXMloMa54BhbhmJ1NWEsghfpYSzL9WpGSV20"
      }
    }
  }
}
```

## 📋 Available Scripts

### Development
- `pnpm run dev` - Start TypeScript watch mode
- `pnpm run build` - Build with lint and version bump
- `pnpm run start` - Run the built server

### Code Quality
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix lint issues
- `pnpm run type-check` - TypeScript validation
- `pnpm run check` - Run lint + type-check

### Testing
- `pnpm run test` - Run tests
- `pnpm run test:watch` - Watch mode
- `pnpm run test:coverage` - With coverage report

### Versioning
- `pnpm run version` - Show current version
- `pnpm run version:patch` - Bump patch (1.0.0 -> 1.0.1)
- `pnpm run version:minor` - Bump minor (1.0.0 -> 1.1.0)
- `pnpm run version:major` - Bump major (1.0.0 -> 2.0.0)

### Release
- `pnpm run release` - Bump version + update changelog
- `pnpm run release:preview` - Preview release changes

## 🎯 Planned Enhancements

### Phase 1: Core Features (Priority)
- [ ] Image-to-image (img2img) generation
- [ ] Dynamic resolution control
- [ ] Enhanced error handling

### Phase 2: Model Management
- [ ] Custom model training
- [ ] Model listing and search
- [ ] Model status tracking

### Phase 3: Advanced Features
- [ ] Image upload system
- [ ] Webhook support
- [ ] Batch processing

## 📊 Current Status

**Version**: 1.0.0
**Build Count**: 0
**Branch**: master (initialized)
**Status**: Ready for development

## 🙏 Attribution

Original project: [everart-forge-mcp](https://github.com/nickbaumann98/everart-forge-mcp)
Original Author: Nick Baumann
Refactored by: Dudoxx UG
Date: 2025-10-22

## 📞 Support

- Issues: Create GitHub issues
- Email: dev@dudoxx.com
- Docs: See README.md and CHANGELOG.md
