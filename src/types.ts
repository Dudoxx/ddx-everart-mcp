/**
 * Type definitions for ddx-everart-mcp
 * Based on EverArt API v1
 */

// ============================================================================
// Generation Types
// ============================================================================

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

// ============================================================================
// Model Types
// ============================================================================

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

export interface ModelListResponse {
  models: Model[];
  hasMore: boolean;
}

// ============================================================================
// Image Upload Types
// ============================================================================

export type ContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';

export interface ImageUpload {
  upload_token: string;
  upload_url: string;
  file_url: string;
  id: string;
}

export interface UploadImageRequest {
  filename: string;
  content_type: ContentType;
  id?: string;
}

// ============================================================================
// MCP Tool Input Types
// ============================================================================

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
  image?: string; // File path, URL, or upload token
  webhookUrl?: string;
}

export interface UploadImageInput {
  file_path: string;
  content_type?: ContentType;
}

export interface ListModelsInput {
  search?: string;
  status?: ModelStatus;
  limit?: number;
  beforeId?: string;
  include_public?: boolean;
}

export interface GetModelInfoInput {
  model_id: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ListImagesInput {
  // Optional filters for future
}

export interface ViewImageInput {
  filename: string;
}

// ============================================================================
// Error Types
// ============================================================================

export enum EverArtErrorType {
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  FORMAT_ERROR = 'FORMAT_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface EverArtError {
  type: EverArtErrorType;
  message: string;
  details?: unknown;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface ServerConfig {
  name: string;
  version: string;
  apiKey: string;
  storageDir: string;
  retryConfig: RetryConfig;
}

// ============================================================================
// Public Models
// ============================================================================

export const PUBLIC_MODELS = {
  FLUX_STANDARD: '5000',
  FLUX_ULTRA: '9000',
  SD35_LARGE: '6000',
  RECRAFT_REALISTIC: '7000',
  RECRAFT_VECTOR: '8000',
} as const;

export const MODEL_NAMES: Record<string, string> = {
  '5000': 'FLUX1.1 [pro] (Standard quality)',
  '9000': 'FLUX1.1 [pro] (Ultra high quality)',
  '6000': 'Stable Diffusion 3.5 Large',
  '7000': 'Recraft V3 - Realistic',
  '8000': 'Recraft V3 - Vector',
};

// ============================================================================
// Format Types
// ============================================================================

export type OutputFormat = 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp';

export const SUPPORTED_FORMATS: OutputFormat[] = ['svg', 'png', 'jpg', 'jpeg', 'webp'];

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  MIN_IMAGE_COUNT: 1,
  MAX_IMAGE_COUNT: 10,
  MIN_DIMENSION: 256,
  MAX_DIMENSION: 2048,
  DEFAULT_DIMENSION: 1024,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;
