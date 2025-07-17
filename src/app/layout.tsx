// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PC Builder - Build Your Perfect PC',
  description: 'Get personalized PC build recommendations with our AI assistant or use expert tools to build your dream PC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}