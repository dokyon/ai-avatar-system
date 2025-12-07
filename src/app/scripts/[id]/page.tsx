'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Script, Video } from '@/lib/supabase'
import Link from 'next/link'
import { UnifiedAvatarSelector } from '@/components/UnifiedAvatarSelector'
import { AvatarPhotoUploader } from '@/components/AvatarPhotoUploader'
import type { Avatar } from '@/types/avatar'

interface AvatarOption {
  id: string;
  name: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category?: string;
  type: 'd-id' | 'custom';
  heygen_avatar_id?: string | null;
  d_id_source_url?: string;
}

export default function ScriptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [script, setScript] = useState<Script | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false)
  const [avatarCreationStatus, setAvatarCreationStatus] = useState<string>('')

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

    // Check if avatar is selected
    if (!selectedAvatar) {
      alert('アバターを選択してください')
      return
    }

    setIsGenerating(true)
    try {
      // For custom avatars, use heygen_avatar_id
      // For D-ID avatars, use the existing logic
      const avatarIdToUse = selectedAvatar.type === 'custom'
        ? selectedAvatar.heygen_avatar_id
        : selectedAvatar.id

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script.id,
          title: script.title,
          content: script.content,
          avatarId: avatarIdToUse,
          avatarUrl: selectedAvatar.d_id_source_url,
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

  const handleAvatarSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar)
  }

  const handleUploadSuccess = async (result: { uploadId: string; fileName: string; publicUrl: string; filePath: string }) => {
    setIsCreatingAvatar(true)
    setAvatarCreationStatus('カスタムアバターを作成中...')

    try {
      // Call create avatar API
      const response = await fetch('/api/avatars/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarName: result.fileName.replace(/\.[^/.]+$/, ''),
          photoUrl: result.publicUrl,
          uploadId: result.uploadId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'アバター作成に失敗しました')
      }

      setAvatarCreationStatus('アバター作成が完了するまで待機中（最大10分）...')

      // Poll for avatar completion
      const avatarId = data.avatarId
      let attempts = 0
      const maxAttempts = 60 // 10 minutes with 10s intervals

      const pollStatus = async () => {
        const statusResponse = await fetch(`/api/avatars/create?id=${avatarId}`)
        const statusData = await statusResponse.json()

        if (statusData.success && statusData.avatar) {
          const avatar = statusData.avatar

          if (avatar.status === 'completed') {
            setAvatarCreationStatus('カスタムアバター作成完了！')
            setShowUploader(false)
            alert('カスタムアバターが作成されました！アバターリストから選択できます。')
            // Refresh the page to reload avatar list
            window.location.reload()
          } else if (avatar.status === 'failed') {
            throw new Error(avatar.error_message || 'アバター作成に失敗しました')
          } else if (attempts < maxAttempts) {
            attempts++
            setAvatarCreationStatus(`処理中... (${attempts}/${maxAttempts})`)
            setTimeout(pollStatus, 10000) // Poll every 10 seconds
          } else {
            throw new Error('タイムアウト: アバター作成に時間がかかりすぎています')
          }
        }
      }

      setTimeout(pollStatus, 10000) // Start polling after 10 seconds
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アバター作成に失敗しました'
      setAvatarCreationStatus(`エラー: ${errorMessage}`)
      alert(errorMessage)
      setIsCreatingAvatar(false)
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

              {/* Unified Avatar Selector */}
              <UnifiedAvatarSelector
                onAvatarSelect={handleAvatarSelect}
                className="mb-4"
              />

              {/* Custom Avatar Upload Section */}
              <div className="mb-4">
                <button
                  onClick={() => setShowUploader(!showUploader)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  {showUploader ? '写真アップロードを閉じる' : '+ カスタムアバターを作成'}
                </button>

                {showUploader && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <AvatarPhotoUploader
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={(error) => alert(error)}
                    />
                    {isCreatingAvatar && avatarCreationStatus && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">{avatarCreationStatus}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !selectedAvatar}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
