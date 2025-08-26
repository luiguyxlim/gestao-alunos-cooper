import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PWAInstaller from '@/components/PWAInstaller'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cooper Pro',
  description: 'Sistema para gerenciar avaliandos e testes de performance',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cooper Pro'
  },
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cooper Pro" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className={inter.className}>
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}
