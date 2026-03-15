'use client'

import dynamic from 'next/dynamic'

const GuiaViewer = dynamic(() => import('./GuiaViewer'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
      Carregando visualizador do guia...
    </div>
  ),
})

export default GuiaViewer
