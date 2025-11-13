'use client'

import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import { useAuth } from '@/hooks/useAuth'
import ReportExporter from '@/components/performance/ReportExporter'
import { Download, BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ResponsiveNavigation user={user} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header com gradiente */}
          <div className="relative mb-12 p-8 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Relatórios 📋
                    </h1>
                    <p className="text-blue-100 text-lg">
                      Exporte resultados em PDF, CSV e XLSX com detalhes completos
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm px-3 py-2 rounded-md text-sm flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </div>
                </div>
              </div>
            </div>
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Exportação de Relatórios</h3>
              </div>
              <div className="text-sm text-gray-500 bg-green-50 px-3 py-2 rounded-lg">
                <span className="font-medium">✨ Novo:</span> Exportação em CSV e XLSX disponível
              </div>
            </div>
            <ReportExporter />
          </div>
        </div>
      </main>
    </div>
  )
}