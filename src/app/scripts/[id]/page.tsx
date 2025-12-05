'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Script, Video } from '@/lib/supabase'
import Link from 'next/link'

export default function ScriptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [script, setScript] = useState<Script | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchScriptAndVideos(params.id as string)
    }
  }, [params.id])

  const fetchScriptAndVideos = async (id: string) => {
    setIsLoading(true)
    try {
      // 台本を取得
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', id)
        .single()

      if (scriptError) throw scriptError
      setScript(scriptData)

      // 関連する動画を取得
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('script_id', id)
        .order('created_at', { ascending: false })

      if (videosError) throw videosError
      setVideos(videosData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!script) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script.id,
          title: script.title,
          content: script.content,
        }),
      })

      if (!response.ok) throw new Error('動画生成に失敗しました')

      const data = await response.json()
      alert('動画生成を開始しました！')

      // ページをリロードして最新の動画一覧を取得
      fetchScriptAndVideos(script.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">台本が見つかりません</p>
          <Link href="/scripts" className="text-blue-600 hover:text-blue-700">
            台本一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/scripts"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← 台本一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{script.title}</h1>
          <p className="mt-2 text-gray-600">
            作成日: {new Date(script.created_at).toLocaleDateString('ja-JP')} |
            ソース: {script.source === 'ai-course-gen' ? 'AIコースGEN' : '手動入力'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 台本内容 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">台本内容</h2>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {script.content}
              </div>
            </div>
          </div>

          {/* 動画生成 */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">動画生成</h2>
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中...' : 'AIアバター動画を生成'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                この台本からAIアバターのリップシンク動画を生成します
              </p>
            </div>

            {/* 生成済み動画一覧 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">生成済み動画</h2>
              {videos.length === 0 ? (
                <p className="text-gray-500 text-sm">まだ動画がありません</p>
              ) : (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{video.title}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          video.status === 'completed' ? 'bg-green-100 text-green-800' :
                          video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          video.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {video.status === 'completed' ? '完了' :
                           video.status === 'processing' ? '処理中' :
                           video.status === 'failed' ? '失敗' : '待機中'}
                        </span>
                      </div>
                      {video.status === 'completed' && video.video_url && (
                        <Link
                          href={`/videos/${video.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          動画を見る →
                        </Link>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(video.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
