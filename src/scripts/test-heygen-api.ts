/**
 * HeyGen API Integration Test Script
 *
 * Tests actual HeyGen API connectivity and video generation
 */

import { HeyGenService } from '../services/heygen.service';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testHeyGenAPI() {
  console.log('🧪 HeyGen API Integration Test Starting...\n');

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...\n');

  try {
    const heygenService = new HeyGenService(apiKey);

    // Test 1: List Avatars
    console.log('📋 Test 1: Listing available avatars...');
    const avatars = await heygenService.listAvatars();
    console.log(`✅ Found ${avatars.length} avatars`);
    if (avatars.length > 0) {
      console.log(`   First avatar: ${avatars[0].avatar_name} (ID: ${avatars[0].avatar_id})`);
    }
    console.log();

    // Test 2: List Voices
    console.log('🎤 Test 2: Listing Japanese voices...');
    const voices = await heygenService.listVoices('Japanese');
    console.log(`✅ Found ${voices.length} Japanese voices`);
    if (voices.length > 0) {
      const femaleVoice = voices.find((v) => v.gender === 'female');
      if (femaleVoice) {
        console.log(`   Female voice: ${femaleVoice.voice_name} (ID: ${femaleVoice.voice_id})`);
      }
    }
    console.log();

    // Test 3: Create Test Video
    console.log('🎬 Test 3: Creating test video...');
    const testScript = 'こんにちは。HeyGen APIのテストです。システムが正常に動作しています。';

    if (avatars.length === 0) {
      console.error('❌ No avatars available for video generation');
      return;
    }

    const defaultAvatar = avatars[0];
    const defaultVoice = voices.find((v) => v.gender === 'female') || voices[0];

    console.log(`   Using avatar: ${defaultAvatar.avatar_name}`);
    console.log(`   Using voice: ${defaultVoice?.voice_name || 'default'}`);
    console.log(`   Script: "${testScript}"`);

    const videoId = await heygenService.createVideo({
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: defaultAvatar.avatar_id,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: testScript,
            voice_id: defaultVoice?.voice_id,
          },
        },
      ],
      dimension: {
        width: 720,
        height: 480,
      },
      test: true, // Use test mode for free tier compatibility
      title: 'HeyGen API Test Video',
    });

    console.log(`✅ Video generation started! Video ID: ${videoId}`);
    console.log();

    // Test 4: Wait for video completion
    console.log('⏳ Test 4: Waiting for video completion...');
    console.log('   (This may take several minutes)');

    let attempt = 0;
    const videoUrl = await heygenService.waitForVideoCompletion(videoId, {
      pollingInterval: 10000, // 10 seconds
      maxAttempts: 60, // 10 minutes max
      onProgress: (status, attemptNum) => {
        attempt = attemptNum;
        console.log(`   [${attempt}] Status: ${status}`);
      },
    });

    console.log();
    console.log('✅ Video generation completed!');
    console.log(`   Video URL: ${videoUrl}`);
    console.log();

    console.log('🎉 All tests passed! HeyGen API integration is working correctly.');
    console.log();
    console.log('📝 Summary:');
    console.log(`   - Avatars available: ${avatars.length}`);
    console.log(`   - Japanese voices: ${voices.length}`);
    console.log(`   - Test video created: ${videoId}`);
    console.log(`   - Video URL: ${videoUrl}`);

  } catch (error) {
    console.error();
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testHeyGenAPI();
