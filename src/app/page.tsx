import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          AI Avatar Training System
        </h1>
        <p className="text-xl text-center mb-12">
          AIアバターが研修台本を読み上げる動画生成システム
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <Link href="/scripts" className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-2xl font-bold mb-4">1. 台本管理</h2>
            <p className="mb-4">AIコースGENから台本をインポートして管理</p>
            <span className="text-blue-600 hover:text-blue-700">開く →</span>
          </Link>

          <div className="p-6 border rounded-lg opacity-50">
            <h2 className="text-2xl font-bold mb-4">2. 動画生成</h2>
            <p className="mb-4">D-ID APIでリップシンク動画を自動生成</p>
            <span className="text-gray-400">準備中</span>
          </div>

          <div className="p-6 border rounded-lg opacity-50">
            <h2 className="text-2xl font-bold mb-4">3. 研修視聴</h2>
            <p className="mb-4">動画とスライドを統合して視聴</p>
            <span className="text-gray-400">準備中</span>
          </div>
        </div>
      </div>
    </main>
  )
}
