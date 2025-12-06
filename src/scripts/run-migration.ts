#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(migrationFile: string): Promise<void> {
  console.log(`\n📄 Running migration: ${path.basename(migrationFile)}`);

  const sql = fs.readFileSync(migrationFile, 'utf8');

  // Split SQL by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.toLowerCase().includes('comment on')) {
      // Skip COMMENT statements as they may not be supported via client
      console.log('⏭️  Skipping COMMENT statement (not supported via client)');
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    } catch (err) {
      // Try alternative method using direct query
      console.log('⚠️  RPC method failed, trying direct query...');

      // Note: This requires service role key for DDL statements
      console.error('❌ Migration failed. Please run the following SQL manually in Supabase dashboard:');
      console.log('\n' + sql + '\n');
      process.exit(1);
    }
  }

  console.log('✅ Migration completed successfully');
}

async function main(): Promise<void> {
  console.log('🗄️  Supabase Migration Runner');
  console.log('==============================\n');

  const migrationFile = process.argv[2] || 'supabase/migrations/002_add_d_id_video_id.sql';
  const fullPath = path.join(process.cwd(), migrationFile);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📂 Migration file: ${migrationFile}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);

  await runMigration(fullPath);

  console.log('\n✅ All migrations completed successfully!');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
