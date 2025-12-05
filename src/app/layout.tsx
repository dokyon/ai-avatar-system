import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Avatar Training System',
  description: 'AI-powered training video generation with avatar lip-sync',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
