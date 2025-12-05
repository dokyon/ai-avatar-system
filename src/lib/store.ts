import { create } from 'zustand'
import { Script, Video } from './supabase'

interface AppState {
  scripts: Script[]
  videos: Video[]
  currentScript: Script | null
  currentVideo: Video | null
  isLoading: boolean
  error: string | null

  // Actions
  setScripts: (scripts: Script[]) => void
  setVideos: (videos: Video[]) => void
  setCurrentScript: (script: Script | null) => void
  setCurrentVideo: (video: Video | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  scripts: [],
  videos: [],
  currentScript: null,
  currentVideo: null,
  isLoading: false,
  error: null,

  setScripts: (scripts) => set({ scripts }),
  setVideos: (videos) => set({ videos }),
  setCurrentScript: (script) => set({ currentScript: script }),
  setCurrentVideo: (video) => set({ currentVideo: video }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
