import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript型定義
export interface Script {
  id: string
  title: string
  content: string
  source: 'ai-course-gen' | 'manual'
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  script_id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  video_url: string | null
  thumbnail_url: string | null
  duration: number
  avatar_id: string | null
  voice_id: string | null
  created_at: string
  updated_at: string
}

export interface Slide {
  id: string
  video_id: string
  file_url: string
  file_name: string
  file_size: number
  page_count: number
  uploaded_at: string
}

export interface ViewingProgress {
  id: string
  user_id: string
  video_id: string
  current_time: number
  completed: boolean
  completed_at: string | null
  updated_at: string
}
