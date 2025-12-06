/**
 * Video generation related types
 */

/** Video generation status */
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Script data for video generation */
export interface ScriptData {
  id: string;
  title: string;
  content: string;
  status: VideoStatus;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** OpenAI TTS API response */
export interface TTSResponse {
  audioBuffer: ArrayBuffer;
  audioUrl: string;
}

/** D-ID API error response */
export interface DIDErrorResponse {
  kind?: string;
  description?: string;
  details?: string;
}

/** D-ID API talk creation response */
export interface DIDCreateResponse {
  id: string;
  status: string;
  created_at: string;
  object?: string;
}

/** D-ID API talk status response */
export interface DIDStatusResponse {
  id: string;
  status: 'created' | 'processing' | 'done' | 'error' | 'rejected';
  result_url?: string;
  error?: DIDErrorResponse;
  created_at: string;
  started_at?: string;
}

/** D-ID API response (legacy - kept for compatibility) */
export interface DIDResponse {
  id: string;
  status: string;
  result_url?: string;
}

/** D-ID Avatar configuration */
export interface DIDAvatarConfig {
  primary: string;
  fallbacks: readonly string[];
}

/** Video generation result */
export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

/** Video generation progress */
export interface VideoGenerationProgress {
  step: 'tts' | 'video' | 'complete';
  status: VideoStatus;
  message: string;
}