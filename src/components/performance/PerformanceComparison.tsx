'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, TrendingUp, Users, Target, Award, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Removed unused import: Button
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { formatters } from '@/lib/performance-utils';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Removed unused interface: Student

interface StudentPerformance {
  evaluatee_id: string;
  student_name: string;
  age: number | null;
  gender: string | null;
  latest_test_date: string | null;
  cooper_test_distance: number;
  vo2_max: number;
  evaluation: string;
  improvement_percentage: number;
}

interface StudentDetails {
  id: string;
  name: string | null;
  birth_date: string | null;
  gender: string | null;
}

interface PerformanceTestRow {
  id: string;
  student_id: string;
  test_date: string;
  cooper_test_distance: number | null;
  vo2_max: number | null;
  evaluation: string | null;
  students: StudentDetails | null;
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
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);



  const loadStudentsPerformance = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    try {
      setLoading(true);
      
      const supabase = createClient();

      const parseNumeric = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '') {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) return parsed;
        }
        return null;
      };

      const normalizeStudent = (student: unknown): StudentDetails | null => {
        if (!student || typeof student !== 'object') return null;
        const typed = student as Partial<StudentDetails> & Record<string, unknown>;
        const id = typeof typed.id === 'string' ? typed.id : null;
        if (!id) return null;

        return {
          id,
          name: typeof typed.name === 'string' ? typed.name : null,
          birth_date: typeof typed.birth_date === 'string' ? typed.birth_date : null,
          gender: typeof typed.gender === 'string' ? typed.gender : null
        };
      };

      const normalizeRow = (row: unknown): PerformanceTestRow | null => {
        if (!row || typeof row !== 'object') return null;
        const typedRow = row as Record<string, unknown>;
        const id = typeof typedRow.id === 'string' ? typedRow.id : null;
        const studentId = typeof typedRow.student_id === 'string' ? typedRow.student_id : null;
        const testDate = typeof typedRow.test_date === 'string' ? typedRow.test_date : null;

        if (!id || !studentId || !testDate) {
          return null;
        }

        const studentData = Array.isArray(typedRow?.students)
          ? typedRow.students[0]
          : typedRow?.students;

        return {
          id,
          student_id: studentId,
          test_date: testDate,
          cooper_test_distance: parseNumeric(typedRow.cooper_test_distance),
          vo2_max: parseNumeric(typedRow.vo2_max),
          evaluation: null,
          students: normalizeStudent(studentData)
        };
      };

      const { data, error } = await supabase
        .from('performance_tests')
        .select(`
          id,
          student_id,
          test_date,
          cooper_test_distance,
          vo2_max,
          students:students!performance_tests_student_id_fkey (
            id,
            name,
            birth_date,
            gender
          )
        `)
        .eq('user_id', user.id)
        .order('test_date', { ascending: false });

      let rows: PerformanceTestRow[] = [];

      if (error) {
        const errorPayload = {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        };

        console.warn('Erro ao buscar testes com join (fallback aplicado):', errorPayload);

        const isRelationshipError = error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('foreign reference');

        if (!isRelationshipError) {
          throw error;
        }

        const fallbackTests = await supabase
          .from('performance_tests')
          .select('id, student_id, test_date, cooper_test_distance, vo2_max')
          .eq('user_id', user.id)
          .order('test_date', { ascending: false });

        if (fallbackTests.error) {
          throw fallbackTests.error;
        }

        rows = (fallbackTests.data ?? [])
          .map(normalizeRow)
          .filter((row): row is PerformanceTestRow => row !== null);

        const studentIds = Array.from(new Set(rows.map(test => test.student_id))).filter(Boolean);

        if (studentIds.length > 0) {
          const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select('id, name, birth_date, gender')
            .eq('user_id', user.id)
            .in('id', studentIds as string[]);

          if (studentsError) {
            console.warn('Erro ao buscar dados dos alunos (fallback):', {
              code: studentsError.code,
              message: studentsError.message,
              details: studentsError.details,
              hint: studentsError.hint
            });
          } else {
            const studentsMap = new Map<string, StudentDetails>();

            (studentsData ?? []).forEach(student => {
              const normalized = normalizeStudent(student);
              if (normalized) {
                studentsMap.set(normalized.id, normalized);
              }
            });

            rows = rows.map(test => ({
              ...test,
              students: studentsMap.get(test.student_id) ?? test.students
            }));
          }
        }
      } else {
        rows = (data ?? [])
          .map(normalizeRow)
          .filter((row): row is PerformanceTestRow => row !== null);
      }

      const testsByStudent = new Map<string, PerformanceTestRow[]>();

      rows.forEach(test => {
        if (!test?.student_id) return;

        if (!testsByStudent.has(test.student_id)) {
          testsByStudent.set(test.student_id, []);
        }

        testsByStudent.get(test.student_id)!.push(test);
      });

      const studentsPerformance: StudentPerformance[] = Array.from(testsByStudent.entries()).map(([studentId, studentTests]) => {
        const sortedTests = [...studentTests].sort((a, b) =>
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
        );

        const latestTest = sortedTests[0];
        const studentDetails = latestTest.students;

        const age = calculateAge(studentDetails?.birth_date ?? null);

        const latestWithMetrics = sortedTests.find(testItem => (
          typeof testItem.cooper_test_distance === 'number' && testItem.cooper_test_distance !== null && !Number.isNaN(testItem.cooper_test_distance)
        ) || (
          typeof testItem.vo2_max === 'number' && testItem.vo2_max !== null && !Number.isNaN(testItem.vo2_max)
        ));

        const earliestWithDistance = [...sortedTests].reverse().find(testItem =>
          typeof testItem.cooper_test_distance === 'number' && testItem.cooper_test_distance !== null && !Number.isNaN(testItem.cooper_test_distance)
        );

        const latestDistance = latestWithMetrics?.cooper_test_distance ?? 0;
        const latestVo2 = latestWithMetrics?.vo2_max ?? 0;
        const firstDistance = earliestWithDistance?.cooper_test_distance ?? 0;

        const improvementPercentage = firstDistance && latestDistance
          ? ((latestDistance - firstDistance) / firstDistance) * 100
          : 0;

        return {
          evaluatee_id: studentId,
          student_name: studentDetails?.name || 'Aluno sem cadastro',
          age,
          gender: studentDetails?.gender || null,
          latest_test_date: latestTest?.test_date || null,
          cooper_test_distance: latestDistance || 0,
          vo2_max: latestVo2 || 0,
          evaluation: 'N/A',
          improvement_percentage: improvementPercentage
        };
      });

      setStudents(studentsPerformance);
      
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeGroup = (age: number | null): string => {
    if (age === null || Number.isNaN(age)) return 'unknown';
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
      'Muito Fraco': '#6b7280',
      'N/A': '#9ca3af'
    };
    return colorMap[evaluation] || '#6b7280';
  };

  const formatGender = (gender: string | null): string => {
    if (!gender) return 'Não informado';
    const normalized = gender.toLowerCase();
    if (normalized.startsWith('m')) return 'Masculino';
    if (normalized.startsWith('f')) return 'Feminino';
    return 'Outro';
  };

  const applyFilters = useCallback(() => {
    let filtered = [...students];
    
    // Filtro por faixa etária
    if (filters.ageGroup !== 'all') {
      filtered = filtered.filter(student => student.age !== null && getAgeGroup(student.age) === filters.ageGroup);
    }
    
    // Filtro por gênero
    if (filters.gender !== 'all') {
    filtered = filtered.filter(student => {
      const normalizedGender = (student.gender || '').toLowerCase();
      if (!normalizedGender) return false;
      if (filters.gender === 'masculino') {
        return normalizedGender.startsWith('m');
      }
      if (filters.gender === 'feminino') {
        return normalizedGender.startsWith('f');
      }
      return !normalizedGender.startsWith('m') && !normalizedGender.startsWith('f');
    });
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
    if (!authLoading) {
      loadStudentsPerformance();
    }
  }, [authLoading, loadStudentsPerformance]);

  useEffect(() => {
    applyFilters();
  }, [students, filters, applyFilters]);

  const getTopPerformers = (metric: 'cooper_test_distance' | 'vo2_max', count: number = 5) => {
    return [...filteredStudents]
      .filter(student => student[metric] > 0)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, count)
      .map((student, index) => ({
        ...student,
        rank: index + 1
      }));
  };

  const getScatterData = () => {
    return filteredStudents
      .filter(student => student.cooper_test_distance > 0 && student.vo2_max > 0)
      .map(student => ({
        x: student.cooper_test_distance,
        y: student.vo2_max,
        name: student.student_name,
        evaluation: student.evaluation,
        age: student.age,
        gender: student.gender
      }));
  };

  if (!isClient || loading || authLoading) {
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
                  <SelectValue placeholder="Todas" />
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
              <Select value={filters.gender} onValueChange={(value) => setFilters({ ...filters, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Avaliação</label>
              <Select value={filters.evaluation} onValueChange={(value) => setFilters({ ...filters, evaluation: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
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
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Distância Cooper" />
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
              {(() => {
                const valid = filteredStudents.filter(student => student.cooper_test_distance > 0);
                if (valid.length === 0) return '0m';
                const average = valid.reduce((sum, s) => sum + s.cooper_test_distance, 0) / valid.length;
                return formatters.cooperDistance(average);
              })()}
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
              {(() => {
                const valid = filteredStudents.filter(student => student.vo2_max > 0);
                if (valid.length === 0) return '0';
                const average = valid.reduce((sum, s) => sum + s.vo2_max, 0) / valid.length;
                return formatters.vo2Max(average);
              })()}
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
                    const ageLabel = data.age ? `${data.age} anos` : 'Idade não informada';
                    return `${data.name} (${ageLabel}, ${formatGender(data.gender)})`;
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
                      {student.age ? `${student.age} anos` : 'Idade não informada'} • {formatGender(student.gender)}
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