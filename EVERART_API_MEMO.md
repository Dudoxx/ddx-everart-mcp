# EverArt API - Complete Reference Memo

**Source**: https://github.com/newcompute-ai/everart-node-sdk
**Base URL**: https://api.everart.ai
**API Version**: v1
**Date**: 2025-10-22
**Analyzed by**: Dudoxx UG

---

## 📋 Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [v1.generations - Image Generation](#v1generations---image-generation)
4. [v1.images - Image Upload](#v1images---image-upload)
5. [v1.models - Model Management](#v1models---model-management)
6. [Error Handling](#error-handling)
7. [Type Definitions](#type-definitions)
8. [Utility Functions](#utility-functions)

---

## API Overview

### Available Namespaces
```typescript
everart.v1.generations  // Image generation (txt2img, img2img)
everart.v1.images       // Image upload system
everart.v1.models       // Custom model training & management
everart.v1.predictions  // @deprecated - Use generations
```

### Public Models
| Model ID | Name | Type | Format Support |
|----------|------|------|----------------|
| 5000 | FLUX1.1 [pro] | General | PNG, JPEG, WebP |
| 9000 | FLUX1.1 [pro] (ultra) | General (Ultra Quality) | PNG, JPEG, WebP |
| 6000 | SD 3.5 Large | Stable Diffusion | PNG, JPEG, WebP |
| 7000 | Recraft V3 - Realistic | Photorealistic | PNG, JPEG, WebP |
| 8000 | Recraft V3 - Vector | Vector Graphics | SVG |

---

## Authentication

### Setup
```typescript
import EverArt from 'everart';
const everart = new EverArt(process.env.EVERART_API_KEY);
```

### Headers
```typescript
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

---

## v1.generations - Image Generation

### 1. Create Generation

**Endpoint**: `POST /v1/models/:id/generations`

#### Method Signature
```typescript
everart.v1.generations.create(
  modelId: string,
  prompt: string,
  type: 'txt2img' | 'img2img',
  options?: {
    image?: string;          // Required for img2img - URL or upload token
    imageCount?: number;     // Default: 1, Range: 1-10
    height?: number;         // Default: varies by model
    width?: number;          // Default: varies by model
    webhookUrl?: string;     // Callback URL for status updates
  }
): Promise<Generation[]>
```

#### Request Body
```json
{
  "prompt": "A beautiful landscape",
  "type": "txt2img",
  "image": "https://...",        // For img2img only
  "image_count": 1,
  "height": 1024,
  "width": 1024,
  "webhook_url": "https://..."
}
```

#### Response
```typescript
type Generation = {
  id: string;
  model_id: string;
  status: 'STARTING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  image_url: string | null;     // Available when status = SUCCEEDED
  type: 'txt2img' | 'img2img';
  createdAt: Date;
  updatedAt: Date;
};
```

#### Response Example
```json
{
  "generations": [{
    "id": "gen_abc123",
    "model_id": "5000",
    "status": "STARTING",
    "image_url": null,
    "type": "txt2img",
    "created_at": "2025-10-22T10:00:00Z",
    "updated_at": "2025-10-22T10:00:00Z"
  }]
}
```

### 2. Fetch Generation

**Endpoint**: `GET /v1/generations/:id`

#### Method Signature
```typescript
everart.v1.generations.fetch(
  id: string
): Promise<Generation>
```

#### Response
```typescript
{
  generation: Generation
}
```

### 3. Fetch With Polling

**Method**: Convenience wrapper that polls until completion

#### Method Signature
```typescript
everart.v1.generations.fetchWithPolling(
  id: string
): Promise<Generation>
```

#### Behavior
- Polls every 1 second
- Continues while status is `STARTING` or `PROCESSING`
- Returns when status is `SUCCEEDED`, `FAILED`, or `CANCELED`

---

## v1.images - Image Upload

### Upload Images

**Endpoint**: `POST /v1/images/uploads`

#### Method Signature
```typescript
everart.v1.images.uploads(
  images: Array<{
    filename: string;
    content_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';
    id?: string;               // Optional - for tracking
  }>
): Promise<ImageUpload[]>
```

#### Request Body
```json
{
  "images": [
    {
      "filename": "photo.jpg",
      "content_type": "image/jpeg",
      "id": "optional-uuid"
    }
  ]
}
```

#### Response
```typescript
type ImageUpload = {
  upload_token: string;        // Use this for img2img or model training
  upload_url: string;          // Pre-signed S3 URL for PUT upload
  file_url: string;            // Public URL after upload
  id: string;                  // Matches request id if provided
};
```

#### Response Example
```json
{
  "image_uploads": [{
    "upload_token": "tok_xyz789",
    "upload_url": "https://s3.amazonaws.com/...",
    "file_url": "https://cdn.everart.ai/...",
    "id": "optional-uuid"
  }]
}
```

#### Upload Workflow
```typescript
// 1. Get upload URLs
const uploads = await everart.v1.images.uploads([{
  filename: 'photo.jpg',
  content_type: 'image/jpeg'
}]);

// 2. Upload file to pre-signed URL
await uploadFile(
  localFilePath,
  uploads[0].upload_url,
  'image/jpeg'
);

// 3. Use upload_token for img2img
const generation = await everart.v1.generations.create(
  '5000',
  'Transform this image',
  'img2img',
  { image: uploads[0].upload_token }
);
```

---

## v1.models - Model Management

### 1. Create Custom Model

**Endpoint**: `POST /v1/models`

#### Method Signature
```typescript
everart.v1.models.create(
  name: string,
  subject: 'OBJECT' | 'STYLE' | 'PERSON',
  images: Array<
    | { type: 'url'; value: string }          // From URL
    | { type: 'file'; path: string }          // From local file
  >,
  options?: {
    webhookUrl?: string;     // Training completion callback
  }
): Promise<Model>
```

#### Request Body
```json
{
  "name": "My Custom Model",
  "subject": "OBJECT",
  "image_urls": [
    "https://example.com/image1.jpg"
  ],
  "image_upload_tokens": [
    "tok_xyz789"
  ],
  "webhook_url": "https://..."
}
```

#### Response
```typescript
type Model = {
  id: string;
  name: string;
  status: 'PENDING' | 'PROCESSING' | 'TRAINING' | 'READY' | 'FAILED' | 'CANCELED';
  subject: 'OBJECT' | 'STYLE' | 'PERSON';
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletedAt?: Date;
  thumbnailUrl?: string;
};
```

#### Training Requirements
- **Minimum Images**: 5
- **Maximum Images**: No explicit limit
- **Supported Formats**: JPEG, PNG, WebP, HEIC, HEIF
- **Image Quality**: Higher quality = better results

#### Subject Types
- **OBJECT**: Products, items, things
- **STYLE**: Artistic styles, aesthetics
- **PERSON**: Specific individuals (with consent)

### 2. Fetch Model

**Endpoint**: `GET /v1/models/:id`

#### Method Signature
```typescript
everart.v1.models.fetch(
  id: string
): Promise<Model>
```

### 3. Fetch Many Models

**Endpoint**: `GET /v1/models`

#### Method Signature
```typescript
everart.v1.models.fetchMany(
  options?: {
    beforeId?: string;       // Pagination cursor
    limit?: number;          // Default: 10, Max: 100
    search?: string;         // Search by name
    status?: ModelStatus;    // Filter by status
  }
): Promise<{
  models: Model[];
  hasMore: boolean;
}>
```

#### Query Parameters
```
GET /v1/models?limit=10&status=READY&search=keyword&before_id=model_123
```

---

## Error Handling

### Error Types
```typescript
type EverArtErrorName =
  | 'EverArtInvalidRequestError'      // 400: Bad request
  | 'EverArtUnauthorizedError'        // 401: Invalid API key
  | 'EverArtForbiddenError'           // 403: Access denied
  | 'EverArtContentModerationError'   // 451: Content policy violation
  | 'EverArtRecordNotFoundError'      // 404: Resource not found
  | 'EverArtUnknownError';            // Other errors
```

### Error Structure
```typescript
class EverArtError extends Error {
  name: EverArtErrorName;
  message: string;  // Includes status and data
}
```

### Example Error Handling
```typescript
try {
  const generation = await everart.v1.generations.create(
    '5000',
    'prompt',
    'txt2img'
  );
} catch (error) {
  if (error instanceof EverArtError) {
    switch (error.name) {
      case 'EverArtUnauthorizedError':
        console.error('Invalid API key');
        break;
      case 'EverArtContentModerationError':
        console.error('Content violates policies');
        break;
      default:
        console.error('API error:', error.message);
    }
  }
}
```

---

## Type Definitions

### Generation Types
```typescript
type GenerationType = 'txt2img' | 'img2img';

type GenerationStatus =
  | 'STARTING'     // Initial state
  | 'PROCESSING'   // Being generated
  | 'SUCCEEDED'    // Complete, image_url available
  | 'FAILED'       // Generation failed
  | 'CANCELED';    // User canceled
```

### Model Types
```typescript
type ModelStatus =
  | 'PENDING'      // Queued for training
  | 'PROCESSING'   // Preparing data
  | 'TRAINING'     // Active training
  | 'READY'        // Available for use
  | 'FAILED'       // Training failed
  | 'CANCELED';    // User canceled

type ModelSubject =
  | 'OBJECT'       // Products, items
  | 'STYLE'        // Artistic styles
  | 'PERSON';      // Specific individuals
```

### Content Types
```typescript
type ContentType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic'
  | 'image/heif';
```

---

## Utility Functions

### 1. makeUrl
```typescript
function makeUrl(version: APIVersion, endpoint: string): string
// Example: makeUrl('v1', 'models/5000/generations')
// Returns: 'https://api.everart.ai/v1/models/5000/generations'
```

### 2. downloadImage
```typescript
function downloadImage(url: string): Promise<string>
// Downloads image to temp directory
// Returns: Local file path
```

### 3. uploadFile
```typescript
function uploadFile(
  filePath: string,
  uploadUrl: string,
  contentType: ContentType
): Promise<void>
// Uploads file to pre-signed URL
```

### 4. getContentType
```typescript
function getContentType(filename: string): ContentType
// Determines MIME type from extension
// Throws error for unsupported formats
```

### 5. sleep
```typescript
function sleep(ms: number): Promise<unknown>
// Async sleep utility
```

---

## Complete Workflow Examples

### Text-to-Image Generation
```typescript
// 1. Create generation
const [generation] = await everart.v1.generations.create(
  '5000',
  'A serene mountain landscape at sunset',
  'txt2img',
  { imageCount: 1, height: 1024, width: 1024 }
);

// 2. Poll until complete
const completed = await everart.v1.generations.fetchWithPolling(
  generation.id
);

// 3. Download image
if (completed.status === 'SUCCEEDED' && completed.image_url) {
  const imagePath = await downloadImage(completed.image_url);
  console.log('Image saved:', imagePath);
}
```

### Image-to-Image Generation
```typescript
// 1. Upload base image
const [upload] = await everart.v1.images.uploads([{
  filename: 'base.jpg',
  content_type: 'image/jpeg'
}]);

await uploadFile('./base.jpg', upload.upload_url, 'image/jpeg');

// 2. Transform image
const [generation] = await everart.v1.generations.create(
  '5000',
  'Make it look like a watercolor painting',
  'img2img',
  { image: upload.upload_token }
);

// 3. Wait for result
const result = await everart.v1.generations.fetchWithPolling(generation.id);
```

### Custom Model Training
```typescript
// 1. Prepare training images
const trainingImages = [
  { type: 'file', path: './product1.jpg' },
  { type: 'file', path: './product2.jpg' },
  { type: 'file', path: './product3.jpg' },
  { type: 'url', value: 'https://example.com/product4.jpg' },
  { type: 'url', value: 'https://example.com/product5.jpg' },
];

// 2. Create model
const model = await everart.v1.models.create(
  'My Product Line',
  'OBJECT',
  trainingImages,
  { webhookUrl: 'https://mysite.com/webhook' }
);

// 3. Check training status
const status = await everart.v1.models.fetch(model.id);

// 4. Use trained model (when status === 'READY')
const [generation] = await everart.v1.generations.create(
  model.id,
  'Product on a white background',
  'txt2img'
);
```

---

## Rate Limits & Best Practices

### Rate Limits
- Not explicitly documented in SDK
- Implement retry logic with exponential backoff
- Monitor 429 responses

### Best Practices
1. **Polling**: Use `fetchWithPolling` for convenience
2. **Webhooks**: Use webhooks for long-running operations
3. **Error Handling**: Always catch and handle EverArtError
4. **Image Upload**: Validate files before uploading
5. **Model Training**: Use high-quality, consistent images
6. **API Keys**: Never commit keys to version control

### Performance Tips
- Cache model IDs for reuse
- Batch image uploads when possible
- Use appropriate image dimensions (avoid unnecessarily large sizes)
- Monitor generation costs per model

---

## API Limitations & Constraints

### Known Limitations
1. **SVG Output**: Only available with model 8000 (Recraft-Vector)
2. **Image Count**: Max 10 images per generation request
3. **Training Images**: Minimum 5 required for custom models
4. **Polling Interval**: SDK uses 1-second intervals
5. **Content Moderation**: Automatic filtering may block certain prompts

### Content Restrictions
- No NSFW content
- No copyrighted material without permission
- No deepfakes or misleading content
- Follow EverArt's Terms of Service

---

## Migration Notes

### From Predictions to Generations
```typescript
// OLD (deprecated)
everart.v1.predictions.create(...)

// NEW
everart.v1.generations.create(...)
```

The API is identical - only the namespace changed.

---

## Appendix: SDK Source Reference

**Repository**: https://github.com/newcompute-ai/everart-node-sdk
**Version**: 1.0.0
**License**: MIT

**Key Files**:
- `src/v1/generations.ts` - Generation API implementation
- `src/v1/models.ts` - Model management implementation
- `src/v1/images.ts` - Image upload implementation
- `src/util.ts` - Utility functions and types

---

**Document Prepared By**: Dudoxx UG
**For Project**: ddx-everart-mcp
**Last Updated**: 2025-10-22
