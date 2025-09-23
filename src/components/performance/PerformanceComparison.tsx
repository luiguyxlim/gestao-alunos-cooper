'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, TrendingUp, Users, Target, Award, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Removed unused import: Button
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { formatters } from '@/lib/performance-utils';
import { createClient } from '@/lib/supabase';

// Removed unused interface: Student

interface StudentPerformance {
  evaluatee_id: string;
  student_name: string;
  age: number;
  gender: 'M' | 'F';
  latest_test_date: string;
  cooper_test_distance: number;
  vo2_max: number;
  evaluation: string;
  improvement_percentage: number;
}

interface ComparisonFilters {
  ageGroup: string;
  gender: string;
  evaluation: string;
  sortBy: string;
}

export default function PerformanceComparison() {
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [filters, setFilters] = useState<ComparisonFilters>({
    ageGroup: 'all',
    gender: 'all',
    evaluation: 'all',
    sortBy: 'cooper_test_distance'
  });

  useEffect(() => {
    setIsClient(true);
  }, []);



  const loadStudentsPerformance = useCallback(async () => {
    try {
      setLoading(true);
      
      const supabase = createClient();
      // Buscar todos os alunos com seus últimos testes
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          birth_date,
          gender,
          performance_tests!inner (
            test_date,
            cooper_test_distance,
            vo2_max,
            evaluation
          )
        `)
      
      if (error) throw error;
      
      // Processar dados para obter o último teste de cada aluno
      const studentsPerformance: StudentPerformance[] = [];
      
      for (const student of data || []) {
        const tests = student.performance_tests;
        if (tests && tests.length > 0) {
          // Ordenar testes por data (mais recente primeiro)
          const sortedTests = tests.sort((a, b) => 
            new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
          );
          
          const latestTest = sortedTests[0];
          const age = calculateAge(student.birth_date);
          
          // Calcular melhoria (se houver mais de um teste)
          let improvementPercentage = 0;
          if (sortedTests.length > 1) {
            const firstTest = sortedTests[sortedTests.length - 1];
            improvementPercentage = ((latestTest.cooper_test_distance - firstTest.cooper_test_distance) / firstTest.cooper_test_distance) * 100;
          }
          
          studentsPerformance.push({
            evaluatee_id: student.id,
            student_name: student.name,
            age,
            gender: student.gender,
            latest_test_date: latestTest.test_date,
            cooper_test_distance: latestTest.cooper_test_distance,
            vo2_max: latestTest.vo2_max,
            evaluation: latestTest.evaluation,
            improvement_percentage: improvementPercentage
          });
        }
      }
      
      setStudents(studentsPerformance);
      
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const getAgeGroup = (age: number): string => {
    if (age < 18) return 'under18';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    return 'over45';
  };

  // Função para obter cor da avaliação
  const getEvaluationColor = (evaluation: string) => {
    const colorMap: Record<string, string> = {
      'Excelente': '#10b981',
      'Muito Bom': '#3b82f6',
      'Bom': '#f59e0b',
      'Regular': '#8b5cf6',
      'Fraco': '#ef4444',
      'Muito Fraco': '#6b7280'
    }
    return colorMap[evaluation] || '#6b7280'
  }

  const applyFilters = useCallback(() => {
    let filtered = [...students];
    
    // Filtro por faixa etária
    if (filters.ageGroup !== 'all') {
      filtered = filtered.filter(student => getAgeGroup(student.age) === filters.ageGroup);
    }
    
    // Filtro por gênero
    if (filters.gender !== 'all') {
      filtered = filtered.filter(student => student.gender === filters.gender);
    }
    
    // Filtro por avaliação
    if (filters.evaluation !== 'all') {
      filtered = filtered.filter(student => student.evaluation === filters.evaluation);
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'cooper_test_distance':
          return b.cooper_test_distance - a.cooper_test_distance;
        case 'vo2_max':
          return b.vo2_max - a.vo2_max;
        case 'improvement':
          return b.improvement_percentage - a.improvement_percentage;
        case 'name':
          return a.student_name.localeCompare(b.student_name);
        default:
          return 0;
      }
    });
    
    setFilteredStudents(filtered);
  }, [students, filters]);

  useEffect(() => {
    loadStudentsPerformance();
  }, [loadStudentsPerformance]);

  useEffect(() => {
    applyFilters();
  }, [students, filters, applyFilters]);

  const getTopPerformers = (metric: 'cooper_test_distance' | 'vo2_max', count: number = 5) => {
    return [...filteredStudents]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, count)
      .map((student, index) => ({
        ...student,
        rank: index + 1
      }));
  };

  const getScatterData = () => {
    return filteredStudents.map(student => ({
      x: student.cooper_test_distance,
      y: student.vo2_max,
      name: student.student_name,
      evaluation: student.evaluation,
      age: student.age,
      gender: student.gender
    }));
  };

  if (!isClient || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Filtros de Comparação</h3>
              <p className="text-blue-100 text-sm">Filtre e compare a performance dos alunos</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Faixa Etária</label>
              <Select value={filters.ageGroup} onValueChange={(value) => setFilters({...filters, ageGroup: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as idades</SelectItem>
                  <SelectItem value="under18">Menor de 18</SelectItem>
                  <SelectItem value="18-25">18-25 anos</SelectItem>
                  <SelectItem value="26-35">26-35 anos</SelectItem>
                  <SelectItem value="36-45">36-45 anos</SelectItem>
                  <SelectItem value="over45">Acima de 45</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Gênero</label>
              <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Avaliação</label>
              <Select value={filters.evaluation} onValueChange={(value) => setFilters({...filters, evaluation: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Muito Fraco">Muito Fraco</SelectItem>
                  <SelectItem value="Fraco">Fraco</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Muito Bom">Muito Bom</SelectItem>
                  <SelectItem value="Excelente">Excelente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cooper_test_distance">Distância Cooper</SelectItem>
                  <SelectItem value="vo2_max">VO2 Máximo</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{filteredStudents.length}</div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Alunos</div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredStudents.length > 0 ? formatters.cooperDistance(filteredStudents.reduce((sum, s) => sum + s.cooper_test_distance, 0) / filteredStudents.length) : '0m'}
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Distância Média</div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredStudents.length > 0 ? formatters.vo2Max(filteredStudents.reduce((sum, s) => sum + s.vo2_max, 0) / filteredStudents.length) : '0'}
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">VO2 Médio</div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredStudents.length > 0 ? `${(filteredStudents.reduce((sum, s) => sum + s.improvement_percentage, 0) / filteredStudents.length).toFixed(1)}%` : '0%'}
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Melhoria Média</div>
        </div>
      </div>

      {/* Gráficos de Comparação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers - Distância Cooper */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Top 5 - Distância Cooper</h3>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopPerformers('cooper_test_distance')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="student_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [formatters.cooperDistance(value as number), 'Distância']} />
                <Bar dataKey="cooper_test_distance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers - VO2 Máximo */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Top 5 - VO2 Máximo</h3>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopPerformers('vo2_max')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="student_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [formatters.vo2Max(value as number), 'VO2 Máx']} />
                <Bar dataKey="vo2_max" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico de Dispersão */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Correlação: Distância Cooper vs VO2 Máximo</h3>
              <p className="text-blue-100 text-sm">Cada ponto representa um aluno</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={getScatterData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                name="Distância Cooper"
                tickFormatter={(value) => formatters.cooperDistance(value)}
              />
              <YAxis 
                dataKey="y" 
                name="VO2 Máximo"
                tickFormatter={(value) => formatters.vo2Max(value)}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'x' ? formatters.cooperDistance(value as number) : formatters.vo2Max(value as number),
                  name === 'x' ? 'Distância Cooper' : 'VO2 Máximo'
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.name} (${data.age} anos, ${data.gender === 'M' ? 'M' : 'F'})`;
                  }
                  return '';
                }}
              />
              <Scatter dataKey="y">
                {getScatterData().map((entry, index) => {
                  return (
                    <Cell key={`cell-${index}`} fill={getEvaluationColor(entry.evaluation)} />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista Detalhada */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Ranking Detalhado</h3>
              <p className="text-orange-100 text-sm">Lista completa dos alunos filtrados</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {filteredStudents.map((student, index) => (
              <div key={student.evaluatee_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{student.student_name}</div>
                    <div className="text-sm text-gray-600">
                      {student.age} anos • {student.gender === 'M' ? 'Masculino' : 'Feminino'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{formatters.cooperDistance(student.cooper_test_distance)}</div>
                    <div className="text-sm text-gray-600">Cooper</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{formatters.vo2Max(student.vo2_max)}</div>
                    <div className="text-sm text-gray-600">VO2 Máx</div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${
                      student.improvement_percentage > 0 ? 'text-green-600' : 
                      student.improvement_percentage < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {student.improvement_percentage > 0 ? '+' : ''}{student.improvement_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Melhoria</div>
                  </div>
                  
                  <Badge style={{ backgroundColor: getEvaluationColor(student.evaluation) }}>
                    {student.evaluation}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum aluno encontrado com os filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}