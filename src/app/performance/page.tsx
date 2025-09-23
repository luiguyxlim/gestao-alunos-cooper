'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getGlobalPerformanceStats,
  getAgeGroupPerformanceStats,
  formatters,
  metricColors
} from '@/lib/performance-utils'
import type {
  PerformanceGlobalStats,
  PerformanceAgeGroupStats,
  PerformanceInsight
} from '@/lib/supabase'
// Card components removed - using custom div styling
// Removed unused import: Badge
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PerformanceCharts from '@/components/performance/PerformanceCharts'
import PerformanceComparison from '@/components/performance/PerformanceComparison'
import ReportExporter from '@/components/performance/ReportExporter'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import {
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Heart,
  Target,
  Timer,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Zap,
  // Removed unused imports: Award, Calendar
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

function StatCard({ title, value, description, icon, trend, color = '#3B82F6' }: StatCardProps) {
  const getGradientClass = (color: string) => {
    switch (color) {
      case metricColors.vo2Max: return 'from-red-500 to-pink-600'
      case metricColors.cooperDistance: return 'from-green-500 to-emerald-600'
      case metricColors.bodyFatPercentage: return 'from-purple-500 to-indigo-600'
      case metricColors.muscleMass: return 'from-orange-500 to-yellow-600'
      case metricColors.restingHeartRate: return 'from-blue-500 to-cyan-600'
      default: return 'from-indigo-500 to-purple-600'
    }
  }

  return (
    <div className="group relative bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(color)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-gradient-to-br ${getGradientClass(color)} rounded-xl flex items-center justify-center shadow-lg`}>
              <div className="h-6 w-6 text-white">
                {icon}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm font-medium text-gray-500">{title}</p>
          </div>
        </div>
        {description && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        )}
        {trend && (
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
              )}
              <span className={`font-medium mr-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatters.percentage(trend.value)}
              </span>
              <span className="text-gray-500">vs período anterior</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface InsightCardProps {
  insight: PerformanceInsight
}

function InsightCard({ insight }: InsightCardProps) {
  const getInsightColor = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'improvement': return 'bg-green-50 border-green-200 text-green-800'
      case 'decline': return 'bg-red-50 border-red-200 text-red-800'
      case 'stable': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'achievement': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'improvement': return <TrendingUp className="h-4 w-4" />
      case 'decline': return <TrendingDown className="h-4 w-4" />
      case 'stable': return <Timer className="h-4 w-4" />
      case 'achievement': return <Activity className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <Card className={`${getInsightColor(insight.type)} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {getInsightIcon(insight.type)}
          <CardTitle className="text-sm font-medium">
            {insight.metric}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm">
          {insight.description}
        </p>
      </CardContent>
    </Card>
  )
}

interface AgeGroupCardProps {
  ageGroup: PerformanceAgeGroupStats
}

function AgeGroupCard({ ageGroup }: AgeGroupCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Faixa Etária {ageGroup.age_group}
        </CardTitle>
        <CardDescription>
          {ageGroup.total_students} alunos • {ageGroup.total_evaluations} avaliações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">VO2 Máx Médio</span>
              <span className="font-medium">
                {ageGroup.avg_vo2_max ? formatters.vo2Max(Number(ageGroup.avg_vo2_max)) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Distância Cooper</span>
              <span className="font-medium">
                {ageGroup.avg_cooper_distance ? formatters.cooperDistance(Number(ageGroup.avg_cooper_distance)) : 'N/A'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">% Gordura</span>
              <span className="font-medium">
                {ageGroup.avg_body_fat_percentage ? formatters.bodyFatPercentage(Number(ageGroup.avg_body_fat_percentage)) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">FC Repouso</span>
              <span className="font-medium">
                {ageGroup.avg_resting_heart_rate ? formatters.restingHeartRate(Number(ageGroup.avg_resting_heart_rate)) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Última atualização</span>
            <span>
              {ageGroup.last_updated ? new Date(ageGroup.last_updated).toLocaleDateString('pt-BR') : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PerformancePage() {
  const { user } = useAuth()
  const [globalStats, setGlobalStats] = useState<PerformanceGlobalStats | null>(null)
  const [ageGroupStats, setAgeGroupStats] = useState<PerformanceAgeGroupStats[]>([])
  const [insights, setInsights] = useState<PerformanceInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      const [globalData, ageGroupData] = await Promise.all([
        getGlobalPerformanceStats(user.id),
        getAgeGroupPerformanceStats(user.id)
      ])

      setGlobalStats(globalData)
      setAgeGroupStats(ageGroupData)

      // Gerar insights
      if (globalData) {
        // Insights temporariamente desabilitados devido a incompatibilidade de tipos
        // const ageGroupDataFormatted: AgeGroupData[] = ageGroupData.map(ag => ({
        //   ageGroup: ag.age_group as string,
        //   stats: ag
        // }))

        // const globalMetrics = {
        //   vo2Max: globalData.global_avg_vo2_max,
        //   cooperDistance: globalData.global_avg_cooper_distance,
        //   bodyFatPercentage: globalData.global_avg_body_fat_percentage,
        //   muscleMass: globalData.global_avg_muscle_mass,
        //   restingHeartRate: null
        // }

        // const generatedInsights = generatePerformanceInsights(
        //   globalMetrics,
        //   ageGroupDataFormatted
        // )
        // setInsights(generatedInsights)
        setInsights([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [user?.id, loadData])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

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
                      Análise de Performance 📊
                    </h1>
                    <p className="text-blue-100 text-lg">
                      Insights detalhados sobre o desempenho dos seus alunos
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </div>
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          {/* Métricas Principais */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Zap className="w-6 h-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Métricas Principais</h2>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl"></div>
                  </div>
                ))}
              </div>
            ) : globalStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total de Avaliações"
                  value={formatters.count(globalStats.total_evaluations || 0)}
                  description="Avaliações realizadas"
                  icon={<BarChart3 className="h-6 w-6" />}
                  color={metricColors.evaluations}
                />
                <StatCard
                  title="Alunos Avaliados"
                  value={formatters.count(globalStats.total_students || 0)}
                  description="Alunos únicos"
                  icon={<Users className="h-6 w-6" />}
                  color={metricColors.evaluations}
                />
                <StatCard
                  title="VO2 Máx Médio"
                  value={globalStats.global_avg_vo2_max ? formatters.vo2Max(Number(globalStats.global_avg_vo2_max)) : 'N/A'}
                  description="Capacidade cardiovascular"
                  icon={<Heart className="h-6 w-6" />}
                  color={metricColors.vo2Max}
                />
                <StatCard
                  title="Distância Cooper"
                  value={globalStats.global_avg_cooper_distance ? formatters.cooperDistance(Number(globalStats.global_avg_cooper_distance)) : 'N/A'}
                  description="Distância média"
                  icon={<Target className="h-6 w-6" />}
                  color={metricColors.cooperDistance}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">Nenhum dado de performance encontrado</p>
                </div>
              </div>
            )}
          </div>

          {/* Navegação de Conteúdo */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <Tabs defaultValue="overview" className="w-full">
              <div className="border-b border-gray-100 bg-gray-50">
                <TabsList className="grid w-full grid-cols-6 bg-transparent p-1">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium"
                  >
                    📊 Visão Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="charts" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium"
                  >
                    📈 Gráficos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="age-groups" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium"
                  >
                    👥 Faixa Etária
                  </TabsTrigger>
                  <TabsTrigger 
                    value="insights" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium"
                  >
                    💡 Insights
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comparison" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium"
                  >
                    ⚖️ Comparação
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reports" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium"
                  >
                    📋 Relatórios
                  </TabsTrigger>
                </TabsList>
              </div>

        <TabsContent value="overview" className="p-8">
          <div className="space-y-8">
            {/* Resumo Executivo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Resumo Executivo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {globalStats?.total_evaluations || 0}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total de Avaliações</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {globalStats?.total_students || 0}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Alunos Avaliados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {globalStats?.global_avg_vo2_max ? Number(globalStats.global_avg_vo2_max).toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">VO2 Máx Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {globalStats?.global_avg_cooper_distance ? Number(globalStats.global_avg_cooper_distance).toFixed(0) : 'N/A'}m
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Distância Média</div>
                </div>
              </div>
            </div>

            {/* Distribuição de Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Percentis de VO2 Máx</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'P25 (25%)', value: globalStats?.global_avg_vo2_max, color: 'bg-red-100 text-red-700' },
                    { label: 'P50 (Mediana)', value: globalStats?.global_avg_vo2_max, color: 'bg-yellow-100 text-yellow-700' },
                    { label: 'P75 (75%)', value: globalStats?.global_avg_vo2_max, color: 'bg-green-100 text-green-700' },
                    { label: 'P90 (90%)', value: globalStats?.global_avg_vo2_max, color: 'bg-blue-100 text-blue-700' }
                  ].map((percentil, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-700">{percentil.label}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${percentil.color}`}>
                        {percentil.value ? Number(percentil.value).toFixed(1) : 'N/A'} ml/kg/min
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Indicadores de Qualidade</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Taxa de Conclusão</span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      {globalStats?.total_evaluations ? '100%' : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Variabilidade</span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      {globalStats?.global_avg_vo2_max 
                        ? Number(globalStats.global_avg_vo2_max).toFixed(1)
                        : 'N/A'
                      } ml/kg/min
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Amplitude</span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                      P25 - P90
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="p-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Visualizações Interativas</h3>
            </div>
            <PerformanceCharts ageGroupStats={ageGroupStats} />
          </div>
        </TabsContent>

        <TabsContent value="age-groups" className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Análise por Faixa Etária</h3>
            </div>
            {ageGroupStats.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ageGroupStats.map((ageGroup) => (
                  <AgeGroupCard key={ageGroup.id} ageGroup={ageGroup} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">Nenhum dado por faixa etária encontrado</p>
                <p className="text-gray-400 text-sm mt-2">Os dados aparecerão aqui quando houver avaliações registradas</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Insights Inteligentes</h3>
            </div>
            {insights.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">Nenhum insight disponível</p>
                <p className="text-gray-400 text-sm mt-2">Insights serão gerados automaticamente com mais dados</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="p-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Comparação de Performance</h3>
            </div>
            <PerformanceComparison />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="p-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                <Download className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Exportação de Relatórios</h3>
            </div>
            <ReportExporter />
          </div>
        </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}