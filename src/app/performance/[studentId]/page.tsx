'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { formatters } from '@/lib/performance-utils';
import { createClient } from '@/lib/supabase';

interface Student {
  id: string;
  name: string;
  email: string;
  birth_date: string;
  gender: 'M' | 'F';
}

interface PerformanceTest {
  id: string;
  evaluatee_id: string;
  test_date: string;
  cooper_test_distance: number;
  vo2_max: number;
  evaluation: string;
  notes?: string;
}

interface PerformanceTrend {
  date: string;
  cooper_test_distance: number;
  vo2_max: number;
  evaluation_score: number;
}

interface RadarData {
  metric: string;
  value: number;
  maxValue: number;
}

interface ComparisonData {
  cooper_test_distance: {
    current: number;
    previous: number;
    change: number;
    percentage: number;
  };
  vo2_max: {
    current: number;
    previous: number;
    change: number;
    percentage: number;
  };
}

export default function StudentPerformancePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [tests, setTests] = useState<PerformanceTest[]>([]);
  const [trendData, setTrendData] = useState<PerformanceTrend[]>([]);
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);

  const processTrendData = useCallback((testsData: PerformanceTest[]) => {
    const trends = testsData.map(test => {
      const evaluationScore = getEvaluationScore(test.evaluation);
      return {
        date: new Date(test.test_date).toLocaleDateString('pt-BR'),
        cooper_test_distance: test.cooper_test_distance,
        vo2_max: test.vo2_max,
        evaluation_score: evaluationScore
      };
    });
    setTrendData(trends);
  }, []);

  const processRadarData = useCallback((testsData: PerformanceTest[]) => {
    const latestTest = testsData[testsData.length - 1];
    if (!latestTest) return;
    
    const age = calculateAge(student?.birth_date || '');
    const gender = student?.gender || 'M';
    
    // Valores de referência baseados em faixas etárias e gênero
    const references = getPerformanceReferences(age, gender);
    
    const radar = [
      {
        metric: 'Distância Cooper',
        value: latestTest.cooper_test_distance,
        maxValue: references.cooper_max
      },
      {
        metric: 'VO2 Máximo',
        value: latestTest.vo2_max,
        maxValue: references.vo2_max
      },
      {
        metric: 'Avaliação',
        value: getEvaluationScore(latestTest.evaluation),
        maxValue: 5
      }
    ];
    
    setRadarData(radar);
  }, [student?.birth_date, student?.gender]);

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Carregar dados do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;
      setStudent(studentData);
      
      // Carregar testes de performance
      const { data: testsData, error: testsError } = await supabase
        .from('performance_tests')
        .select('*')
        .eq('student_id', studentId)
        .order('test_date', { ascending: true });
      
      if (testsError) {
        console.error('Erro ao carregar testes de performance:', testsError);
        // Se a tabela não existe, continua com array vazio
        if (testsError.code === 'PGRST116' || testsError.code === 'PGRST205' || testsError.message?.includes('Could not find the table') || testsError.message?.includes('relation "public.performance_tests" does not exist')) {
          console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.');
          setTests([]);
        } else {
          throw testsError;
        }
      } else {
        setTests(testsData || []);
      }
      
      // Processar dados para gráficos
      if (testsData && testsData.length > 0) {
        processTrendData(testsData);
        processRadarData(testsData);
        await generateComparison(testsData);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, processRadarData, processTrendData]);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId, loadStudentData]);

  const generateComparison = async (testsData: PerformanceTest[]) => {
    if (testsData.length < 2) return;
    
    const latest = testsData[testsData.length - 1];
    const previous = testsData[testsData.length - 2];
    
    const comp = {
      cooper_test_distance: {
        current: latest.cooper_test_distance,
        previous: previous.cooper_test_distance,
        change: latest.cooper_test_distance - previous.cooper_test_distance,
        percentage: ((latest.cooper_test_distance - previous.cooper_test_distance) / previous.cooper_test_distance) * 100
      },
      vo2_max: {
        current: latest.vo2_max,
        previous: previous.vo2_max,
        change: latest.vo2_max - previous.vo2_max,
        percentage: ((latest.vo2_max - previous.vo2_max) / previous.vo2_max) * 100
      }
    };
    
    setComparison(comp);
  };

  const getEvaluationScore = (evaluation: string): number => {
    const scores: { [key: string]: number } = {
      'Muito Fraco': 1,
      'Fraco': 2,
      'Regular': 3,
      'Bom': 4,
      'Muito Bom': 5,
      'Excelente': 5
    };
    return scores[evaluation] || 3;
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPerformanceReferences = (age: number, gender: string) => {
    // Valores de referência simplificados
    const baseValues = {
      cooper_max: gender === 'M' ? 3200 : 2800,
      vo2_max: gender === 'M' ? 60 : 55
    };
    
    // Ajustar baseado na idade
    if (age < 20) {
      baseValues.cooper_max *= 1.1;
      baseValues.vo2_max *= 1.1;
    } else if (age > 40) {
      baseValues.cooper_max *= 0.9;
      baseValues.vo2_max *= 0.9;
    }
    
    return baseValues;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getEvaluationColor = (evaluation: string) => {
    const colorMap: Record<string, string> = {
      'Excelente': '#10b981',
      'Muito Bom': '#3b82f6',
      'Bom': '#f59e0b',
      'Regular': '#ef4444',
      'Fraco': '#6b7280',
      'Muito Fraco': '#374151'
    };
    return colorMap[evaluation] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Aluno não encontrado</h1>
          <Link href="/performance">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Performance
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/performance">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600">
              {calculateAge(student.birth_date)} anos • {student.gender === 'M' ? 'Masculino' : 'Feminino'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {tests.length} teste{tests.length !== 1 ? 's' : ''} realizado{tests.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhum teste de performance registrado para este aluno.</p>
            <Link href={`/students/${studentId}/cooper-test`}>
              <Button>Realizar Primeiro Teste</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="trends">Evolução</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Card Principal - Último Teste */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Último Teste Realizado</CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                      {new Date(tests[tests.length - 1].test_date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <Badge 
                    className="text-white font-medium px-4 py-2 text-sm" 
                    style={{ backgroundColor: getEvaluationColor(tests[tests.length - 1].evaluation) }}
                  >
                    {tests[tests.length - 1].evaluation}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Distância Cooper */}
              <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-pink-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Distância Percorrida</CardTitle>
                      <CardDescription className="text-gray-600">Teste de 12 minutos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-pink-600">
                    {formatters.cooperDistance(tests[tests.length - 1].cooper_test_distance)}
                  </div>
                  <div className="text-lg text-gray-600">
                    {(tests[tests.length - 1].cooper_test_distance / 1000).toFixed(2)} km
                  </div>
                  <div className="text-sm text-gray-500">
                    Distância total percorrida
                  </div>
                  {comparison && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-pink-200">
                      {getTrendIcon(comparison.cooper_test_distance.change)}
                      <span className={`font-medium ${getTrendColor(comparison.cooper_test_distance.change)}`}>
                        {comparison.cooper_test_distance.change > 0 ? '+' : ''}
                        {formatters.cooperDistance(comparison.cooper_test_distance.change)}
                      </span>
                      <span className="text-sm text-gray-500">vs. teste anterior</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* VO2 Máximo */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">VO2 Máximo</CardTitle>
                      <CardDescription className="text-gray-600">Capacidade cardiorrespiratória</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-green-600">
                    {formatters.vo2Max(tests[tests.length - 1].vo2_max)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Consumo máximo de oxigênio
                  </div>
                  {comparison && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-green-200">
                      {getTrendIcon(comparison.vo2_max.change)}
                      <span className={`font-medium ${getTrendColor(comparison.vo2_max.change)}`}>
                        {comparison.vo2_max.change > 0 ? '+' : ''}
                        {comparison.vo2_max.change.toFixed(1)} ml/kg/min
                      </span>
                      <span className="text-sm text-gray-500">vs. teste anterior</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Card de Recomendações */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Distância de Treino</CardTitle>
                    <CardDescription className="text-gray-600">Recomendação para 70% VO2</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-blue-600">
                  {Math.round(tests[tests.length - 1].cooper_test_distance * 0.7)} m
                </div>
                <div className="text-lg text-gray-600">
                  {((tests[tests.length - 1].cooper_test_distance * 0.7) / 1000).toFixed(2)} km
                </div>
                <div className="text-sm text-gray-500">
                  Distância recomendada para treino aeróbico
                </div>
                <div className="flex items-center space-x-2 pt-2 border-t border-blue-200">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    70% Intensidade
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico Radar */}
            {radarData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Atual</CardTitle>
                  <CardDescription>Comparação com valores de referência</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                      <Radar
                        name="Atual"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-8">
            {/* Resumo da Evolução */}
            {trendData.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Progresso Total</CardTitle>
                    <CardDescription className="text-gray-600">Desde o primeiro teste</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Distância Cooper:</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(trendData[trendData.length - 1].cooper_test_distance - trendData[0].cooper_test_distance)}
                          <span className={`font-medium ${getTrendColor(trendData[trendData.length - 1].cooper_test_distance - trendData[0].cooper_test_distance)}`}>
                            {trendData[trendData.length - 1].cooper_test_distance - trendData[0].cooper_test_distance > 0 ? '+' : ''}
                            {formatters.cooperDistance(trendData[trendData.length - 1].cooper_test_distance - trendData[0].cooper_test_distance)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">VO2 Máximo:</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(trendData[trendData.length - 1].vo2_max - trendData[0].vo2_max)}
                          <span className={`font-medium ${getTrendColor(trendData[trendData.length - 1].vo2_max - trendData[0].vo2_max)}`}>
                            {trendData[trendData.length - 1].vo2_max - trendData[0].vo2_max > 0 ? '+' : ''}
                            {(trendData[trendData.length - 1].vo2_max - trendData[0].vo2_max).toFixed(1)} ml/kg/min
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Estatísticas</CardTitle>
                    <CardDescription className="text-gray-600">Resumo dos testes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total de testes:</span>
                        <span className="font-medium text-gray-900">{tests.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Melhor distância:</span>
                        <span className="font-medium text-gray-900">
                          {formatters.cooperDistance(Math.max(...tests.map(t => t.cooper_test_distance)))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Melhor VO2:</span>
                        <span className="font-medium text-gray-900">
                          {formatters.vo2Max(Math.max(...tests.map(t => t.vo2_max)))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráficos de Evolução */}
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Evolução da Distância Cooper</CardTitle>
                      <CardDescription className="text-gray-600">Progresso ao longo do tempo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value/1000).toFixed(1)}km`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatters.cooperDistance(value as number), 'Distância']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cooper_test_distance"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Evolução do VO2 Máximo</CardTitle>
                      <CardDescription className="text-gray-600">Capacidade cardiorrespiratória ao longo do tempo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value.toFixed(0)}`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatters.vo2Max(value as number), 'VO2 Máx']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="vo2_max"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-8">
            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nome:</span>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Idade:</span>
                    <span className="font-medium text-gray-900">{calculateAge(student.birth_date)} anos</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gênero:</span>
                    <span className="font-medium text-gray-900">{student.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Melhor Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const bestTest = tests.reduce((best, current) => 
                      current.cooper_test_distance > best.cooper_test_distance ? current : best
                    )
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Distância:</span>
                          <span className="font-medium text-gray-900">{formatters.cooperDistance(bestTest.cooper_test_distance)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">VO2 Máx:</span>
                          <span className="font-medium text-gray-900">{formatters.vo2Max(bestTest.vo2_max)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avaliação:</span>
                          <Badge style={{ backgroundColor: getEvaluationColor(bestTest.evaluation) }}>
                            {bestTest.evaluation}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Data:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(bestTest.test_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Última Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const lastTest = tests[tests.length - 1]
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Distância:</span>
                          <span className="font-medium text-gray-900">{formatters.cooperDistance(lastTest.cooper_test_distance)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">VO2 Máx:</span>
                          <span className="font-medium text-gray-900">{formatters.vo2Max(lastTest.vo2_max)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avaliação:</span>
                          <Badge style={{ backgroundColor: getEvaluationColor(lastTest.evaluation) }}>
                            {lastTest.evaluation}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Data:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(lastTest.test_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Histórico de Testes */}
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Histórico Completo de Testes</CardTitle>
                    <CardDescription className="text-gray-600">
                      Todos os {tests.length} testes realizados por {student.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.map((test, index) => {
                    const isLatest = index === tests.length - 1
                    const isBest = test.cooper_test_distance === Math.max(...tests.map(t => t.cooper_test_distance))
                    
                    return (
                      <div key={test.id} className={`border rounded-xl p-6 space-y-4 transition-all hover:shadow-md ${
                        isLatest ? 'border-blue-200 bg-blue-50/50' : 
                        isBest ? 'border-green-200 bg-green-50/50' : 
                        'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-lg text-gray-900">
                                Teste #{tests.length - index}
                              </span>
                              {isLatest && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  Mais Recente
                                </span>
                              )}
                              {isBest && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  Melhor Resultado
                                </span>
                              )}
                              <Badge style={{ backgroundColor: getEvaluationColor(test.evaluation) }}>
                                {test.evaluation}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              {new Date(test.test_date).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="space-y-1">
                              <p className="font-bold text-2xl text-gray-900">
                                {formatters.cooperDistance(test.cooper_test_distance)}
                              </p>
                              <p className="text-sm text-gray-600">
                                VO2 Máx: <span className="font-semibold">{formatters.vo2Max(test.vo2_max)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {test.notes && (
                          <div className="pt-4 border-t border-gray-200">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">Observações:</span>
                              </p>
                              <p className="text-sm text-gray-700 mt-1">{test.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}