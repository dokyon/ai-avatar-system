/**
 * D-ID API連携ライブラリ
 */

/**
 * D-ID APIレスポンスの型定義
 */
export interface DIdVideoResponse {
  id: string;
  status: 'created' | 'processing' | 'done' | 'error';
  result_url?: string;
  error?: {
    kind: string;
    description: string;
  };
}

/**
 * 動画生成結果の型定義
 */
export interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

/**
 * 動画ステータス確認結果の型定義
 */
export interface VideoStatusResult {
  success: boolean;
  status?: string;
  videoUrl?: string;
  error?: string;
}

/**
 * D-ID接続テスト結果の型定義
 */
export interface DIdConnectionResult {
  success: boolean;
  error?: string;
}

/**
 * D-ID APIのベースURL
 */
const D_ID_API_BASE = 'https://api.d-id.com';

/**
 * D-ID APIリクエスト用のヘッダーを取得
 */
function getDIdHeaders(): HeadersInit {
  const apiKey = process.env.D_ID_API_KEY;
  
  if (!apiKey) {
    throw new Error('D_ID_API_KEY environment variable is not set');
  }
  
  return {
    'Authorization': `Basic ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * D-ID APIへのHTTPリクエストを実行
 */
async function makeDIdRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${D_ID_API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getDIdHeaders(),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D-ID API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`D-ID API request failed: ${String(error)}`);
  }
}

/**
 * D-ID API接続テスト
 */
export async function testDIdConnection(): Promise<DIdConnectionResult> {
  try {
    // クレジット残高を確認することで接続をテスト
    await makeDIdRequest('/credits');
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * AIアバター動画を生成
 */
export async function generateVideo(
  text: string,
  avatarUrl?: string
): Promise<VideoGenerationResult> {
  try {
    const requestBody = {
      script: {
        type: 'text',
        input: text,
        subtitles: false
      },
      config: {
        fluent: false,
        pad_audio: 0
      },
      source_url: avatarUrl || 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg'
    };
    
    const response = await makeDIdRequest<DIdVideoResponse>('/talks', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    if (!response.id) {
      throw new Error('No video ID returned from D-ID API');
    }
    
    return {
      success: true,
      videoId: response.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 動画生成ステータスを確認
 */
export async function getVideoStatus(videoId: string): Promise<VideoStatusResult> {
  try {
    const response = await makeDIdRequest<DIdVideoResponse>(`/talks/${videoId}`);
    
    let videoUrl: string | undefined;
    if (response.status === 'done' && response.result_url) {
      videoUrl = response.result_url;
    }
    
    return {
      success: true,
      status: response.status,
      videoUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 動画を削除
 */
export async function deleteVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await makeDIdRequest(`/talks/${videoId}`, {
      method: 'DELETE'
    });
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}