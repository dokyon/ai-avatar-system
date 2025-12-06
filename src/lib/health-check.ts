/**
 * システムヘルスチェックユーティリティ
 */

import { supabase } from './supabase';
import { testDIdConnection } from './d-id';

/**
 * ヘルスチェック結果の型定義
 */
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
}

/**
 * 全体的なヘルスチェック結果
 */
export interface SystemHealthResult {
  overall: 'healthy' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: string;
}

/**
 * Supabase接続チェック
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('scripts')
      .select('count', { count: 'exact', head: true });
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        service: 'Supabase',
        status: 'unhealthy',
        message: `Connection error: ${error.message}`,
        responseTime
      };
    }
    
    return {
      service: 'Supabase',
      status: 'healthy',
      message: 'Connection successful',
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'Supabase',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
}

/**
 * D-ID API接続チェック
 */
export async function checkDIdHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const result = await testDIdConnection();
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      return {
        service: 'D-ID API',
        status: 'healthy',
        message: 'API connection successful',
        responseTime
      };
    } else {
      return {
        service: 'D-ID API',
        status: 'unhealthy',
        message: result.error || 'API connection failed',
        responseTime
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'D-ID API',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
}

/**
 * 環境変数チェック
 */
export function checkEnvironmentHealth(): HealthCheckResult {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'D_ID_API_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    return {
      service: 'Environment Variables',
      status: 'unhealthy',
      message: `Missing variables: ${missingVars.join(', ')}`
    };
  }
  
  return {
    service: 'Environment Variables',
    status: 'healthy',
    message: 'All required environment variables are set'
  };
}

/**
 * 全体的なシステムヘルスチェック
 */
export async function runHealthCheck(): Promise<SystemHealthResult> {
  const timestamp = new Date().toISOString();
  
  console.log('🏥 Starting system health check...', { timestamp });
  
  const healthChecks = await Promise.allSettled([
    Promise.resolve(checkEnvironmentHealth()),
    checkSupabaseHealth(),
    checkDIdHealth()
  ]);
  
  const services = healthChecks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const serviceNames = ['Environment Variables', 'Supabase', 'D-ID API'];
      return {
        service: serviceNames[index],
        status: 'unhealthy' as const,
        message: `Health check failed: ${result.reason}`
      };
    }
  });
  
  const overall = services.every(service => service.status === 'healthy') 
    ? 'healthy' as const
    : 'unhealthy' as const;
  
  console.log(overall === 'healthy' 
    ? '✅ System health check passed' 
    : '⚠️ System health check found issues'
  );
  
  return {
    overall,
    services,
    timestamp
  };
}

/**
 * ヘルスチェック結果を表示
 */
export function displayHealthResult(result: SystemHealthResult): void {
  console.log('\n' + '='.repeat(50));
  console.log('🏥 SYSTEM HEALTH CHECK');
  console.log('='.repeat(50));
  console.log(`⏰ Timestamp: ${result.timestamp}`);
  console.log(`🎯 Overall Status: ${result.overall === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log('');
  
  result.services.forEach(service => {
    const statusIcon = service.status === 'healthy' ? '✅' : '❌';
    console.log(`${statusIcon} ${service.service}:`);
    console.log(`   Status: ${service.status.toUpperCase()}`);
    console.log(`   Message: ${service.message}`);
    if (service.responseTime) {
      console.log(`   Response Time: ${service.responseTime}ms`);
    }
    console.log('');
  });
  
  console.log('='.repeat(50));
}