'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Video, Script } from '@/lib/supabase'
import Link from 'next/link'

export default function VideoPlayerPage() {
  const params = useParams()
  const [video, setVideo] = useState<Video | null>(null)
  const [script, setScript] = useState<Script | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchVideo(params.id as string)
    }
  }, [params.id])

  const fetchVideo = async (id: string) => {
    setIsLoading(true)
    try {
      // 動画を取得
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single()

      if (videoError) throw videoError
      setVideo(videoData)

      // 関連する台本を取得
      if (videoData.script_id) {
        const { data: scriptData, error: scriptError } = await supabase
          .from('scripts')
          .select('*')
          .eq('id', videoData.script_id)
          .single()

        if (scriptError) throw scriptError
        setScript(scriptData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  if (!video || video.status !== 'completed' || !video.video_url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {!video
              ? '動画が見つかりません'
              : video.status === 'processing'
              ? '動画を生成中です...'
              : '動画がまだ利用できません'}
          </p>
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
            href={`/scripts/${video.script_id}`}
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← 台本に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>
          <p className="mt-2 text-gray-600">
            作成日: {new Date(video.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 動画プレイヤー */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg">
              <video
                controls
                className="w-full"
                src={video.video_url}
              >
                お使いのブラウザは動画タグをサポートしていません。
              </video>
            </div>

            {script && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold mb-4">台本</h2>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {script.content}
                </div>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">動画情報</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      完了
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">再生時間</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    約 {video.duration} 秒
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(video.created_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">ダウンロード</h2>
              <a
                href={video.video_url}
                download
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block text-center"
              >
                動画をダウンロード
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
