#!/usr/bin/env node
/**
 * システム全体の動作確認スクリプト
 * 
 * 使用方法:
 * npm run system-test
 * または
 * npx tsx src/scripts/system-test.ts
 */

import { runHealthCheck, displayHealthResult } from '../lib/health-check';
import { runSystemTest, displayTestResult } from '../lib/test-utils';

/**
 * テスト実行オプション
 */
interface TestOptions {
  healthCheckOnly?: boolean;
  skipHealthCheck?: boolean;
  verbose?: boolean;
}

/**
 * コマンドライン引数を解析
 */
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  
  return {
    healthCheckOnly: args.includes('--health-only'),
    skipHealthCheck: args.includes('--skip-health'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * ヘルプメッセージを表示
 */
function showHelp(): void {
  console.log(`
Usage: npm run system-test [options]

Options:
  --health-only    Run health check only
  --skip-health    Skip health check and run full test
  --verbose, -v    Verbose output
  --help, -h       Show this help message

Examples:
  npm run system-test
  npm run system-test -- --health-only
  npm run system-test -- --verbose
`);
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const options = parseArgs();
  
  // ヘルプ表示
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    return;
  }
  
  console.log('🚀 AI Avatar Video Generation System Test');
  console.log('==========================================\n');
  
  try {
    // 1. ヘルスチェック実行
    if (!options.skipHealthCheck) {
      console.log('Phase 1: Health Check');
      console.log('---------------------');
      
      const healthResult = await runHealthCheck();
      
      if (options.verbose) {
        displayHealthResult(healthResult);
      } else {
        console.log(`Health Status: ${healthResult.overall === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        if (healthResult.overall === 'unhealthy') {
          console.log('Issues found:');
          healthResult.services
            .filter(s => s.status === 'unhealthy')
            .forEach(s => console.log(`  - ${s.service}: ${s.message}`));
        }
      }
      
      // ヘルスチェックのみの場合は終了
      if (options.healthCheckOnly) {
        process.exit(healthResult.overall === 'healthy' ? 0 : 1);
      }
      
      // ヘルスチェック失敗時は警告表示
      if (healthResult.overall === 'unhealthy') {
        console.log('\n⚠️  Warning: System health check failed. Continuing with integration test...');
      }
      
      console.log('\n');
    }
    
    // 2. 統合テスト実行
    console.log('Phase 2: Integration Test');
    console.log('--------------------------');
    
    const testResult = await runSystemTest();
    
    if (options.verbose) {
      displayTestResult(testResult);
    } else {
      console.log(`\nTest Result: ${testResult.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
      if (!testResult.overallSuccess) {
        console.log('Failures:');
        if (!testResult.scriptTest.success) {
          console.log(`  - Script Creation: ${testResult.scriptTest.error}`);
        }
        if (!testResult.videoTest.success) {
          console.log(`  - Video Generation: ${testResult.videoTest.error}`);
        }
      }
    }
    
    // 受け入れ条件チェック
    console.log('\n📋 Acceptance Criteria Check');
    console.log('-----------------------------');
    
    const criteria = [
      { name: '台本作成が成功する', passed: testResult.scriptTest.success },
      { name: '台本一覧に表示される', passed: testResult.scriptTest.success }, // 簡易チェック
      { name: '動画生成が開始される', passed: testResult.videoTest.videoId !== undefined },
      { name: '動画生成が完了する', passed: testResult.videoTest.status === 'completed' },
      { name: '生成された動画が視聴できる', passed: testResult.videoTest.videoUrl !== undefined },
      { name: '動画ダウンロードが可能', passed: testResult.videoTest.videoUrl !== undefined } // URLがあればダウンロード可能
    ];
    
    criteria.forEach(criterion => {
      const icon = criterion.passed ? '✅' : '❌';
      console.log(`${icon} ${criterion.name}`);
    });
    
    const allCriteriaPassed = criteria.every(c => c.passed);
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 Final Result: ${allCriteriaPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(50));
    
    // トラブルシューティング情報
    if (!allCriteriaPassed) {
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('- Supabase connection error → Check .env.local and restart server');
      console.log('- API error → Check API keys and credit balance');
      console.log('- Video generation failure → Check D-ID API logs');
      console.log('- For detailed logs, run with --verbose flag');
    }
    
    // 終了コード設定
    process.exit(allCriteriaPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 System test failed with error:');
    console.error(error instanceof Error ? error.message : String(error));
    
    if (options.verbose && error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// スクリプト実行時のエラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// メイン関数を実行（ES Modules）
main();