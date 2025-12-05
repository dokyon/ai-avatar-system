'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { supabase, Script } from '@/lib/supabase'
import Link from 'next/link'

export default function ScriptsPage() {
  const { scripts, setScripts, setLoading, setError } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: 'manual' as 'manual' | 'ai-course-gen'
  })

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setScripts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('scripts')
        .insert([formData])

      if (error) throw error

      setFormData({ title: '', content: '', source: 'manual' })
      setShowForm(false)
      fetchScripts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この台本を削除しますか？')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchScripts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">台本管理</h1>
            <p className="mt-2 text-gray-600">研修動画用の台本を管理します</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ホームに戻る
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'キャンセル' : '新規台本作成'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">新規台本作成</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="研修のタイトルを入力"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  台本内容
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="AIアバターが読み上げる台本を入力してください"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ソース
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as 'manual' | 'ai-course-gen' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">手動入力</option>
                  <option value="ai-course-gen">AIコースGEN</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                台本を作成
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">台本がまだありません</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                最初の台本を作成
              </button>
            </div>
          ) : (
            scripts.map((script) => (
              <div
                key={script.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{script.title}</h3>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    {script.source === 'ai-course-gen' ? 'AIコースGEN' : '手動'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {script.content}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  作成日: {new Date(script.created_at).toLocaleDateString('ja-JP')}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/scripts/${script.id}`}
                    className="flex-1 px-3 py-2 text-center bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    詳細
                  </Link>
                  <button
                    onClick={() => handleDelete(script.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
