# ddx-everart-mcp Refactoring Plan

**Version**: 2.0.0
**Date**: 2025-10-22
**Status**: In Progress
**Scope**: Implement all EverArt API capabilities (excluding personal model training)

---

## 🎯 Objectives

### Current State (v1.0.0)
- ✅ Text-to-image (txt2img) generation
- ✅ 5 public models support
- ✅ Format conversion (SVG, PNG, JPEG, WebP)
- ✅ Local image storage
- ✅ Basic error handling
- ⚠️ Hardcoded 1024x1024 resolution

### Target State (v2.0.0)
- ✅ Text-to-image (txt2img) - Enhanced
- 🆕 Image-to-image (img2img) generation
- 🆕 Image upload system
- 🆕 Model management (list/search custom models)
- 🆕 Dynamic resolution control
- 🆕 Enhanced error handling with retries
- 🆕 Webhook support (optional)
- ❌ Personal model training (explicitly excluded)

---

## 📋 Implementation Tasks

### Phase 1: Core Infrastructure (Priority: HIGH)

#### 1.1 Enhanced Type Definitions
**File**: `src/types.ts` (NEW)

```typescript
// Generation types
export type GenerationType = 'txt2img' | 'img2img';
export type GenerationStatus = 'STARTING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

export interface Generation {
  id: string;
  model_id: string;
  status: GenerationStatus;
  image_url: string | null;
  type: GenerationType;
  createdAt: Date;
  updatedAt: Date;
}

// Model types
export type ModelStatus = 'PENDING' | 'PROCESSING' | 'TRAINING' | 'READY' | 'FAILED' | 'CANCELED';
export type ModelSubject = 'OBJECT' | 'STYLE' | 'PERSON';

export interface Model {
  id: string;
  name: string;
  status: ModelStatus;
  subject: ModelSubject;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletedAt?: Date;
  thumbnailUrl?: string;
}

// Image upload types
export type ContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';

export interface ImageUpload {
  upload_token: string;
  upload_url: string;
  file_url: string;
  id: string;
}

// Tool input types
export interface GenerateImageInput {
  prompt: string;
  model?: string;
  type?: GenerationType;
  format?: string;
  output_path?: string;
  web_project_path?: string;
  project_type?: string;
  asset_path?: string;
  image_count?: number;
  height?: number;
  width?: number;
  image?: string;  // For img2img: file path or URL
  webhookUrl?: string;
}
```

#### 1.2 API Client Enhancement
**File**: `src/everart-client.ts` (NEW)

- Wrap EverArt SDK with better typing
- Add retry logic
- Centralize API calls
- Error mapping

#### 1.3 Image Processing Utils
**File**: `src/image-utils.ts` (NEW)

- Image upload handling
- Format validation
- Local file processing
- URL validation

---

### Phase 2: Image Upload System (Priority: HIGH)

#### 2.1 New MCP Tool: `upload_image`

**Purpose**: Upload local images for img2img or model training

**Input Schema**:
```typescript
{
  file_path: string;          // Local file path
  content_type?: ContentType; // Auto-detected if not provided
}
```

**Output**:
```typescript
{
  upload_token: string;     // Use for img2img
  file_url: string;        // Public URL
  success: boolean;
}
```

**Implementation**:
1. Validate file exists
2. Detect content type
3. Request upload URL from API
4. Upload file to S3
5. Return upload token

---

### Phase 3: Image-to-Image Generation (Priority: HIGH)

#### 3.1 Enhanced `generate_image` Tool

**New Parameters**:
```typescript
{
  type?: 'txt2img' | 'img2img';  // Default: 'txt2img'
  image?: string;                 // Required for img2img
                                 // Accepts:
                                 // - Local file path
                                 // - HTTP(S) URL
                                 // - Upload token
  height?: number;               // Dynamic resolution
  width?: number;                // Dynamic resolution
}
```

**Workflow for img2img**:
1. Validate `image` parameter
2. If local file → upload → get token
3. If URL → use directly
4. If token → use directly
5. Call API with type='img2img' and image parameter
6. Process result

---

### Phase 4: Model Management (Priority: MEDIUM)

#### 4.1 New MCP Tool: `list_models`

**Purpose**: List available models (public + custom)

**Input Schema**:
```typescript
{
  search?: string;          // Search by name
  status?: ModelStatus;     // Filter by status
  limit?: number;           // Default: 10, Max: 100
  include_public?: boolean; // Default: true
}
```

**Output**:
```typescript
{
  models: Array<{
    id: string;
    name: string;
    type: 'public' | 'custom';
    status: ModelStatus;
    subject?: ModelSubject;
  }>;
  hasMore: boolean;
  total: number;
}
```

#### 4.2 New MCP Tool: `get_model_info`

**Purpose**: Get detailed model information

**Input**: `model_id: string`

**Output**: Full `Model` object with metadata

---

### Phase 5: Enhanced Features (Priority: MEDIUM)

#### 5.1 Dynamic Resolution
- Remove hardcoded 1024x1024
- Accept `height` and `width` parameters
- Validate against model constraints
- Default to model-specific recommendations

#### 5.2 Webhook Support
- Add optional `webhookUrl` parameter
- Document webhook payload format
- Add to generation and model tools

#### 5.3 Batch Operations
- Support multiple images in single request
- Progress tracking
- Parallel processing where possible

---

### Phase 6: Enhanced Error Handling (Priority: HIGH)

#### 6.1 Retry Logic
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [429, 500, 502, 503, 504]
};
```

#### 6.2 Error Categorization
- Map API errors to user-friendly messages
- Provide actionable suggestions
- Log detailed errors for debugging

#### 6.3 Validation
- Pre-validate all inputs before API calls
- Check file sizes, formats, dimensions
- Validate model compatibility

---

## 🏗️ Architecture Changes

### New File Structure
```
src/
├── index.ts                    # Main MCP server (refactored)
├── types.ts                    # Type definitions (NEW)
├── everart-client.ts          # API client wrapper (NEW)
├── image-utils.ts             # Image processing (NEW)
├── tools/                     # Tool handlers (NEW)
│   ├── generate-image.ts
│   ├── upload-image.ts
│   ├── list-models.ts
│   ├── get-model-info.ts
│   ├── list-images.ts
│   └── view-image.ts
├── utils/                     # Utilities (NEW)
│   ├── error-handler.ts
│   ├── retry.ts
│   └── validator.ts
└── __tests__/                 # Tests (NEW)
    ├── generate-image.test.ts
    ├── upload-image.test.ts
    └── models.test.ts
```

### Tool Registry
```typescript
const TOOLS = {
  generate_image: {
    handler: generateImageTool,
    schema: generateImageSchema,
  },
  upload_image: {
    handler: uploadImageTool,
    schema: uploadImageSchema,
  },
  list_models: {
    handler: listModelsTool,
    schema: listModelsSchema,
  },
  get_model_info: {
    handler: getModelInfoTool,
    schema: getModelInfoSchema,
  },
  list_images: {
    handler: listImagesTool,
    schema: listImagesSchema,
  },
  view_image: {
    handler: viewImageTool,
    schema: viewImageSchema,
  },
};
```

---

## 🧪 Testing Strategy

### Unit Tests
- Each tool handler independently
- API client mocking
- Error scenarios
- Input validation

### Integration Tests
- Real API calls (with test account)
- Upload → Generate workflow
- Model listing
- Error handling flows

### Coverage Target
- Minimum 80% code coverage
- All critical paths tested
- Error scenarios covered

---

## 📝 Documentation Updates

### README.md
- New tool descriptions
- img2img examples
- Model management guide
- Upload workflow

### CHANGELOG.md
- v2.0.0 release notes
- Breaking changes (if any)
- Migration guide

### API_REFERENCE.md (NEW)
- Complete tool reference
- Parameter descriptions
- Response formats
- Code examples

---

## 🚫 Explicitly Excluded Features

### Personal Model Training
**Reason**: Complex workflow, requires user consent, data privacy concerns

**What's Excluded**:
- ❌ `train_model` tool
- ❌ Training image upload for custom models
- ❌ Model training status tracking
- ❌ Training webhook handlers

**What's Included**:
- ✅ Listing custom models (already trained)
- ✅ Using custom models for generation
- ✅ Fetching model metadata
- ✅ Searching models

---

## 📊 Success Criteria

### Functional
- ✅ img2img generation works
- ✅ Image upload succeeds
- ✅ Model listing returns results
- ✅ Dynamic resolutions apply
- ✅ Error handling is robust

### Quality
- ✅ 80%+ test coverage
- ✅ All lint checks pass
- ✅ TypeScript strict mode
- ✅ No any types
- ✅ Comprehensive documentation

### Performance
- ✅ Retry logic prevents failures
- ✅ Upload completes < 30s
- ✅ API calls timeout properly
- ✅ Memory efficient

---

## 🗓️ Implementation Timeline

### Day 1: Infrastructure
- Create new file structure
- Add type definitions
- Set up API client wrapper
- Add image utilities

### Day 2: Upload System
- Implement `upload_image` tool
- Add file validation
- Test upload workflow
- Document usage

### Day 3: img2img
- Enhance `generate_image` tool
- Add img2img support
- Integrate upload system
- Add dynamic resolution

### Day 4: Model Management
- Implement `list_models` tool
- Implement `get_model_info` tool
- Add filtering/search
- Document workflows

### Day 5: Polish & Test
- Add comprehensive tests
- Fix bugs
- Update documentation
- Prepare release

---

## 🔧 Breaking Changes

### None Expected
- All changes are additive
- Existing `generate_image` remains backward compatible
- New parameters are optional
- No removed functionality

---

## 📦 Dependencies

### New Dependencies
```json
{
  "uuid": "^9.0.0",           // For upload IDs
  "mime-types": "^2.1.35"     // Content type detection
}
```

### Updated Dependencies
- None required

---

## 🎓 Learning Resources

### For Implementation
- EverArt API Memo (EVERART_API_MEMO.md)
- Official SDK (node_modules/everart)
- MCP SDK docs

### For Testing
- Jest documentation
- API testing best practices
- Integration testing patterns

---

**Status**: Ready to begin implementation
**Next Step**: Start Phase 1 - Core Infrastructure
