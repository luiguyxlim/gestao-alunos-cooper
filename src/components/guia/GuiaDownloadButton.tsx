'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type DownloadStatus = 'idle' | 'loading' | 'success' | 'error'

export default function GuiaDownloadButton() {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [message, setMessage] = useState('')

  const handleDownload = async () => {
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/guia/download', {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Você não tem permissão para baixar este arquivo.')
        }
        if (response.status === 404) {
          throw new Error('Arquivo do guia não encontrado.')
        }
        if (response.status === 422) {
          throw new Error('Arquivo do guia está corrompido.')
        }
        throw new Error('Falha ao baixar o arquivo.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'GUIA COLORIDO.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      setStatus('success')
      setMessage('Download concluído com sucesso.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Falha ao baixar o arquivo.')
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={handleDownload} disabled={status === 'loading'}>
        {status === 'loading' ? 'Baixando...' : 'Baixar PDF original'}
      </Button>
      {message ? (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`} aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  )
}
