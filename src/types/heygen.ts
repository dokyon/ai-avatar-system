/**
 * HeyGen API Type Definitions
 * @see https://docs.heygen.com/reference/
 */

// Avatar Types
export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  preview_video_url?: string;
  gender?: 'male' | 'female';
  is_customized?: boolean;
}

export interface HeyGenAvatarListResponse {
  data: {
    avatars: HeyGenAvatar[];
  };
}

// Voice Types
export interface HeyGenVoice {
  voice_id: string;
  voice_name: string;
  language: string;
  gender?: 'male' | 'female';
  preview_audio?: string;
}

export interface HeyGenVoiceListResponse {
  data: {
    voices: HeyGenVoice[];
  };
}

// Video Creation Types
export interface HeyGenVideoScript {
  type: 'text';
  input_text: string;
  voice_id?: string;
}

export interface HeyGenVideoInput {
  character: {
    type: 'avatar';
    avatar_id: string;
    avatar_style?: 'normal' | 'circle';
  };
  voice: {
    type: 'text';
    input_text: string;
    voice_id?: string;
  };
  background?: {
    type: 'color' | 'image' | 'video';
    value?: string;
  };
}

export interface HeyGenCreateVideoRequest {
  video_inputs: HeyGenVideoInput[];
  dimension?: {
    width: number;
    height: number;
  };
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  test?: boolean;
  title?: string;
}

export interface HeyGenCreateVideoResponse {
  error: string | null;
  data: {
    video_id: string;
  };
}

// Video Status Types
export type HeyGenVideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface HeyGenVideoStatusResponse {
  error: string | null;
  data: {
    video_id: string;
    status: HeyGenVideoStatus;
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
    error?: {
      code: string;
      message: string;
    };
  };
}

// Photo Avatar Creation Types
export interface HeyGenCreatePhotoAvatarRequest {
  avatar_name: string;
  photo_url: string;
}

export interface HeyGenCreatePhotoAvatarResponse {
  error: string | null;
  data: {
    avatar_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface HeyGenPhotoAvatarStatusResponse {
  error: string | null;
  data: {
    avatar_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    preview_image_url?: string;
    preview_video_url?: string;
    error?: {
      code: string;
      message: string;
    };
  };
  message?: string;
}

// Error Types
export interface HeyGenErrorResponse {
  code: number;
  message: string;
  detail?: string;
}

export class HeyGenError extends Error {
  code?: number;
  detail?: string;
  retryable: boolean;

  constructor(message: string, code?: number, detail?: string, retryable = false) {
    super(message);
    this.name = 'HeyGenError';
    this.code = code;
    this.detail = detail;
    this.retryable = retryable;
  }
}
