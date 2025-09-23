'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
// Card components removed - using custom div styling
// Removed unused imports: formatters, metricColors
import type { PerformanceAgeGroupStats } from '@/lib/supabase'
import { BarChart3 } from 'lucide-react'

interface PerformanceChartsProps {
  ageGroupStats: PerformanceAgeGroupStats[]
}

interface ChartDataPoint {
  ageGroup: string
  vo2Max: number
  cooperDistance: number
  bodyFat: number
  restingHR: number
  totalStudents: number
}

const COLORS = {
  vo2Max: '#3B82F6',
  cooperDistance: '#10B981',
  bodyFat: '#F59E0B',
  restingHR: '#EF4444',
  evaluations: '#8B5CF6'
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{`Faixa Etária: ${label}`}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function Vo2MaxBarChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">VO2 Máximo por Faixa Etária</h3>
        <p className="text-sm text-gray-600">
          Comparação da capacidade cardiovascular entre diferentes idades
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="ageGroup" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
              label={{ value: 'ml/kg/min', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="vo2Max" 
              fill={COLORS.vo2Max}
              radius={[4, 4, 0, 0]}
              name="VO2 Máx (ml/kg/min)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CooperDistanceLineChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Distância Cooper por Faixa Etária</h3>
        <p className="text-sm text-gray-600">
          Evolução da performance no teste de Cooper
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="ageGroup" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
              label={{ value: 'metros', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="cooperDistance" 
              stroke={COLORS.cooperDistance}
              strokeWidth={3}
              dot={{ fill: COLORS.cooperDistance, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: COLORS.cooperDistance, strokeWidth: 2 }}
              name="Distância (m)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function EvaluationsPieChart({ data }: { data: ChartDataPoint[] }) {
  const pieData = data.map(item => ({
    name: item.ageGroup,
    value: item.totalStudents,
    percentage: 0 // Will be calculated
  }))

  const total = pieData.reduce((sum, item) => sum + item.value, 0)
  pieData.forEach(item => {
    item.percentage = Math.round((item.value / total) * 100)
  })

  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Distribuição de Avaliações</h3>
        <p className="text-sm text-gray-600">
          Proporção de avaliações por faixa etária
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, 'Avaliações']}
              labelFormatter={(label) => `Faixa Etária: ${label}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function PerformanceRadarChart({ data }: { data: ChartDataPoint[] }) {
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
  
  // Normalize data for radar chart (0-100 scale)
  const normalizedData = data.map(item => {
    const maxVo2 = Math.max(...data.map(d => d.vo2Max))
    const maxCooper = Math.max(...data.map(d => d.cooperDistance))
    const minBodyFat = Math.min(...data.filter(d => d.bodyFat > 0).map(d => d.bodyFat))
    const maxBodyFat = Math.max(...data.map(d => d.bodyFat))
    const minHR = Math.min(...data.filter(d => d.restingHR > 0).map(d => d.restingHR))
    const maxHR = Math.max(...data.map(d => d.restingHR))

    return {
      ageGroup: item.ageGroup,
      'VO2 Máx': item.vo2Max > 0 ? Math.round((item.vo2Max / maxVo2) * 100) : 0,
      'Cooper': item.cooperDistance > 0 ? Math.round((item.cooperDistance / maxCooper) * 100) : 0,
      'Composição': item.bodyFat > 0 ? Math.round(((maxBodyFat - item.bodyFat) / (maxBodyFat - minBodyFat)) * 100) : 0,
      'FC Repouso': item.restingHR > 0 ? Math.round(((maxHR - item.restingHR) / (maxHR - minHR)) * 100) : 0
    }
  })

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Radar de Performance</h3>
        <p className="text-sm text-gray-600">
          Comparação multidimensional normalizada (0-100%)
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={normalizedData}>
            <PolarGrid />
            <PolarAngleAxis tick={{ fontSize: 12 }} />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            {normalizedData.map((entry, index) => (
              <Radar
                key={entry.ageGroup}
                name={entry.ageGroup}
                dataKey={entry.ageGroup}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MultiMetricChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Métricas Comparativas</h3>
        <p className="text-sm text-gray-600">
          Comparação de múltiplas métricas por faixa etária
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="ageGroup" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="vo2Max" 
              fill={COLORS.vo2Max}
              name="VO2 Máx (ml/kg/min)"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="cooperDistance" 
              fill={COLORS.cooperDistance}
              name="Cooper (m)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function PerformanceCharts({ ageGroupStats }: PerformanceChartsProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Transform data for charts
  const chartData: ChartDataPoint[] = ageGroupStats.map(stat => ({
    ageGroup: stat.age_group,
    vo2Max: Number(stat.avg_vo2_max) || 0,
    cooperDistance: Number(stat.avg_cooper_distance) || 0,
    bodyFat: Number(stat.avg_body_fat_percentage) || 0,
    restingHR: Number(stat.avg_resting_heart_rate) || 0,
    totalStudents: stat.total_evaluations || 0
  })).filter(data => data.totalStudents > 0) // Only show age groups with data

  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center h-64 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Carregando gráficos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center h-64 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Dados insuficientes para gerar gráficos</p>
            <p className="text-gray-400 text-sm mt-1">Adicione mais avaliações para visualizar os gráficos</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Vo2MaxBarChart data={chartData} />
        <CooperDistanceLineChart data={chartData} />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <EvaluationsPieChart data={chartData} />
        <MultiMetricChart data={chartData} />
      </div>
      
      <PerformanceRadarChart data={chartData} />
    </div>
  )
}

export {
  Vo2MaxBarChart,
  CooperDistanceLineChart,
  EvaluationsPieChart,
  PerformanceRadarChart,
  MultiMetricChart
}