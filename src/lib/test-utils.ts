/**
 * システム全体の動作確認用テストユーティリティ
 */

import { supabase } from './supabase';
import { generateVideo, getVideoStatus } from './d-id';

/**
 * 台本作成テスト用のデータ
 */
export interface TestScript {
  title: string;
  content: string;
}

/**
 * 台本作成のテスト結果
 */
export interface ScriptTestResult {
  success: boolean;
  scriptId?: string;
  error?: string;
}

/**
 * 動画生成のテスト結果
 */
export interface VideoTestResult {
  success: boolean;
  videoId?: string;
  status?: string;
  videoUrl?: string;
  error?: string;
}

/**
 * システム全体のテスト結果
 */
export interface SystemTestResult {
  scriptTest: ScriptTestResult;
  videoTest: VideoTestResult;
  overallSuccess: boolean;
  timestamp: string;
}

/**
 * テスト用台本データ
 */
export const TEST_SCRIPT: TestScript = {
  title: 'テスト研修',
  content: 'こんにちは。これはテスト用の研修動画です。'
};

/**
 * 台本作成のテストを実行
 */
export async function testScriptCreation(script: TestScript): Promise<ScriptTestResult> {
  try {
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        title: script.title,
        content: script.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (!data || !data.id) {
      throw new Error('Failed to create script: No data returned');
    }

    return {
      success: true,
      scriptId: data.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * 動画生成のテストを実行
 */
export async function testVideoGeneration(scriptId: string, script: TestScript): Promise<VideoTestResult> {
  try {
    // 動画生成を開始
    const generateResult = await generateVideo(script.content);
    
    if (!generateResult.success || !generateResult.videoId) {
      throw new Error(`Video generation failed: ${generateResult.error}`);
    }

    const videoId = generateResult.videoId;

    // データベースに動画情報を保存
    const { error: dbError } = await supabase
      .from('videos')
      .insert({
        script_id: scriptId,
        title: script.title,
        d_id_video_id: videoId,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 動画生成完了まで待機（最大5分）
    const maxWaitTime = 5 * 60 * 1000; // 5分
    const pollInterval = 10 * 1000; // 10秒
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const statusResult = await getVideoStatus(videoId);
      
      if (statusResult.success && statusResult.status === 'done') {
        // データベースのステータスを更新
        await supabase
          .from('videos')
          .update({
            status: 'completed',
            video_url: statusResult.videoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('d_id_video_id', videoId);

        return {
          success: true,
          videoId,
          status: 'completed',
          videoUrl: statusResult.videoUrl
        };
      }
      
      if (statusResult.success && statusResult.status === 'error') {
        throw new Error('Video generation failed on D-ID side');
      }

      // 10秒待機
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Video generation timeout (5 minutes)');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * システム全体のテストを実行
 */
export async function runSystemTest(): Promise<SystemTestResult> {
  const timestamp = new Date().toISOString();
  
  console.log('🚀 Starting system test...', { timestamp });
  
  // 1. 台本作成テスト
  console.log('📝 Testing script creation...');
  const scriptTest = await testScriptCreation(TEST_SCRIPT);
  
  if (!scriptTest.success) {
    console.error('❌ Script creation test failed:', scriptTest.error);
    return {
      scriptTest,
      videoTest: { success: false, error: 'Skipped due to script creation failure' },
      overallSuccess: false,
      timestamp
    };
  }
  
  console.log('✅ Script creation test passed:', { scriptId: scriptTest.scriptId });
  
  // 2. 動画生成テスト
  console.log('🎬 Testing video generation...');
  const videoTest = await testVideoGeneration(scriptTest.scriptId!, TEST_SCRIPT);
  
  if (!videoTest.success) {
    console.error('❌ Video generation test failed:', videoTest.error);
  } else {
    console.log('✅ Video generation test passed:', {
      videoId: videoTest.videoId,
      status: videoTest.status,
      videoUrl: videoTest.videoUrl
    });
  }
  
  const overallSuccess = scriptTest.success && videoTest.success;
  
  console.log(overallSuccess ? '🎉 System test completed successfully!' : '⚠️ System test completed with errors');
  
  return {
    scriptTest,
    videoTest,
    overallSuccess,
    timestamp
  };
}

/**
 * テスト結果をコンソールに表示
 */
export function displayTestResult(result: SystemTestResult): void {
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYSTEM TEST RESULT');
  console.log('='.repeat(50));
  console.log(`⏰ Timestamp: ${result.timestamp}`);
  console.log(`🎯 Overall Success: ${result.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  console.log('📝 Script Creation Test:');
  console.log(`   Status: ${result.scriptTest.success ? '✅ PASS' : '❌ FAIL'}`);
  if (result.scriptTest.success) {
    console.log(`   Script ID: ${result.scriptTest.scriptId}`);
  } else {
    console.log(`   Error: ${result.scriptTest.error}`);
  }
  console.log('');
  
  console.log('🎬 Video Generation Test:');
  console.log(`   Status: ${result.videoTest.success ? '✅ PASS' : '❌ FAIL'}`);
  if (result.videoTest.success) {
    console.log(`   Video ID: ${result.videoTest.videoId}`);
    console.log(`   Status: ${result.videoTest.status}`);
    console.log(`   Video URL: ${result.videoTest.videoUrl}`);
  } else {
    console.log(`   Error: ${result.videoTest.error}`);
  }
  
  console.log('='.repeat(50));
}