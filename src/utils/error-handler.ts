/**
 * Error handling utilities for ddx-everart-mcp
 */

import { EverArtErrorType } from '../types.js';

export interface EverArtError {
  type: EverArtErrorType;
  message: string;
  details?: unknown;
}

/**
 * Helper function for creating error responses
 */
export function errorResponse(error: EverArtError): {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
} {
  console.error(`[${error.type}] ${error.message}`, error.details || '');
  return {
    content: [{ type: 'text', text: `Error: ${error.message}` }],
    isError: true,
  };
}

/**
 * Helper for handling API errors in a user-friendly way (not currently used but kept for future)
 */
export function handleApiError(error: unknown): EverArtError {
  const err = error as {
    response?: {
      status: number;
      statusText: string;
      data?: { message?: string };
    };
    request?: unknown;
    message?: string;
  };

  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (err.response.status === 401 || err.response.status === 403) {
      return {
        type: EverArtErrorType.AUTHENTICATION_ERROR,
        message: 'Authentication failed. Please check your API key.',
        details: err.response.data,
      };
    } else if (err.response.status === 429) {
      return {
        type: EverArtErrorType.API_ERROR,
        message: 'Rate limit exceeded. Please try again later.',
        details: err.response.data,
      };
    } else {
      return {
        type: EverArtErrorType.API_ERROR,
        message: `API error: ${err.response.data?.message || err.response.statusText}`,
        details: err.response.data,
      };
    }
  } else if (err.request) {
    // The request was made but no response was received
    return {
      type: EverArtErrorType.NETWORK_ERROR,
      message: 'Network error. Failed to connect to EverArt API.',
      details: err.message,
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      type: EverArtErrorType.UNKNOWN_ERROR,
      message: err.message || 'Unknown error occurred',
      details: error,
    };
  }
}
