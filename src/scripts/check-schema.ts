#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking videos table schema...\n');

  // Try to query the table structure
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying table:', error.message);
    return false;
  }

  console.log('✅ Successfully queried videos table');

  if (data && data.length > 0) {
    console.log('\n📋 Sample record structure:');
    console.log(Object.keys(data[0]));

    if ('d_id_video_id' in data[0]) {
      console.log('\n✅ d_id_video_id column exists!');
      return true;
    } else {
      console.log('\n❌ d_id_video_id column NOT found');
      console.log('Available columns:', Object.keys(data[0]));
      return false;
    }
  } else {
    console.log('\n⚠️  No records in table yet. Attempting to insert test record...');

    const { error: insertError } = await supabase
      .from('videos')
      .insert({
        title: 'Schema Test',
        status: 'pending',
        d_id_video_id: 'test-id'
      })
      .select();

    if (insertError) {
      if (insertError.message.includes('d_id_video_id')) {
        console.log('❌ d_id_video_id column does not exist');
        return false;
      } else {
        console.error('❌ Insert error:', insertError.message);
        return false;
      }
    }

    console.log('✅ d_id_video_id column exists and accepts data!');

    // Clean up test record
    await supabase
      .from('videos')
      .delete()
      .eq('title', 'Schema Test');

    return true;
  }
}

checkSchema()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
