'use client'

import { useEffect, useState } from 'react'

// SVG Icons
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SmartphoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

type NotificationType = 'install' | 'update' | 'offline' | null

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notification, setNotification] = useState<NotificationType>(null)

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    checkInstalled()

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!isInstalled) {
        setShowInstallButton(true)
        setNotification('install')
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallButton(false)
      setNotification(null)
      console.log('PWA was installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Register service worker with update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('SW registered: ', reg)
          setRegistration(reg)

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNotification('update')
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })

    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallButton(false)
    setNotification(null)
  }

  const handleUpdateClick = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const dismissNotification = () => {
    setNotification(null)
    if (notification === 'install') {
      setShowInstallButton(false)
    }
  }

  const renderNotification = () => {
    if (!notification) return null

    const notificationConfig = {
      install: {
        icon: <DownloadIcon />,
        title: 'Instalar Cooper Pro',
        message: 'Instale o app para acesso rápido e funcionalidades offline',
        action: handleInstallClick,
        actionText: 'Instalar',
        bgColor: 'bg-blue-600',
        hoverColor: 'hover:bg-blue-700'
      },
      update: {
        icon: <RefreshIcon />,
        title: 'Atualização Disponível',
        message: 'Uma nova versão do Cooper Pro está disponível',
        action: handleUpdateClick,
        actionText: 'Atualizar',
        bgColor: 'bg-green-600',
        hoverColor: 'hover:bg-green-700'
      },
      offline: {
        icon: <SmartphoneIcon />,
        title: 'Modo Offline',
        message: 'Você está offline. Algumas funcionalidades podem estar limitadas',
        action: null,
        actionText: null,
        bgColor: 'bg-orange-600',
        hoverColor: 'hover:bg-orange-700'
      }
    }

    const config = notificationConfig[notification]

    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className={`${config.bgColor} text-white p-4 rounded-lg shadow-lg`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {config.icon}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{config.title}</h4>
                <p className="text-xs opacity-90 mt-1">{config.message}</p>
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XIcon />
            </button>
          </div>
          {config.action && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={config.action}
                className={`${config.hoverColor} bg-white/20 text-white px-3 py-1 rounded text-sm font-medium transition-colors`}
              >
                {config.actionText}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show install button for non-installed apps
  if (showInstallButton && !isInstalled && !notification) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <DownloadIcon />
          Instalar App
        </button>
      </div>
    )
  }

  return renderNotification()
}