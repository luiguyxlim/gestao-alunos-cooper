'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, Users, TrendingUp } from 'lucide-react';
import { formatters } from '@/lib/performance-utils';
import { createClient } from '@/lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body?: string[][];
      theme?: string;
      styles?: { fontSize?: number };
      headStyles?: { fillColor?: number[] };
    }) => jsPDF;
  }
}

interface ReportOptions {
  type: 'individual' | 'group' | 'comparison';
  period: 'last30' | 'last90' | 'last180' | 'all';
  format: 'summary' | 'detailed';
  includeCharts: boolean;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  birth_date: string;
  gender: 'M' | 'F';
  tests: PerformanceTest[];
}

interface PerformanceTest {
  id: string;
  test_date: string;
  cooper_test_distance: number;
  vo2_max: number;
  evaluation: string;
  notes?: string;
}

export default function ReportExporter() {
  const [options, setOptions] = useState<ReportOptions>({
    type: 'group',
    period: 'last90',
    format: 'summary',
    includeCharts: false
  });
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadStudents = async () => {
    if (studentsLoaded) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          email,
          birth_date,
          gender,
          performance_tests (
            id,
            test_date,
            cooper_test_distance,
            vo2_max,
            evaluation,
            notes
          )
        `)
        .order('name')
      
      if (error) throw error;
      
      const studentsData = data?.map(student => ({
        ...student,
        tests: student.performance_tests || []
      })) || [];
      
      setStudents(studentsData);
      setStudentsLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
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

  const filterTestsByPeriod = (tests: PerformanceTest[], period: string): PerformanceTest[] => {
    if (period === 'all') return tests;
    
    const days = {
      'last30': 30,
      'last90': 90,
      'last180': 180
    }[period] || 90;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return tests.filter(test => new Date(test.test_date) >= cutoffDate);
  };

  const generateIndividualReport = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const filteredTests = filterTestsByPeriod(student.tests, options.period);
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Individual de Performance', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`${student.name}`, pageWidth / 2, 35, { align: 'center' });
    
    // Informações do aluno
    pdf.setFontSize(12);
    const age = calculateAge(student.birth_date);
    pdf.text(`Idade: ${age} anos`, 20, 55);
    pdf.text(`Gênero: ${student.gender === 'M' ? 'Masculino' : 'Feminino'}`, 20, 65);
    pdf.text(`Email: ${student.email}`, 20, 75);
    pdf.text(`Período: ${getPeriodLabel(options.period)}`, 20, 85);
    pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 95);
    
    // Resumo estatístico
    if (filteredTests.length > 0) {
      const latestTest = filteredTests[filteredTests.length - 1];
      const firstTest = filteredTests[0];
      
      pdf.setFontSize(14);
      pdf.text('Resumo Estatístico', 20, 115);
      
      pdf.setFontSize(12);
      pdf.text(`Total de testes: ${filteredTests.length}`, 20, 130);
      pdf.text(`Último teste: ${new Date(latestTest.test_date).toLocaleDateString('pt-BR')}`, 20, 140);
      pdf.text(`Distância Cooper atual: ${formatters.cooperDistance(latestTest.cooper_test_distance)}`, 20, 150);
      pdf.text(`VO2 Máximo atual: ${formatters.vo2Max(latestTest.vo2_max)}`, 20, 160);
      pdf.text(`Avaliação atual: ${latestTest.evaluation}`, 20, 170);
      
      if (filteredTests.length > 1) {
        const improvement = ((latestTest.cooper_test_distance - firstTest.cooper_test_distance) / firstTest.cooper_test_distance) * 100;
        pdf.text(`Melhoria no período: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`, 20, 180);
      }
      
      // Tabela de testes
      if (options.format === 'detailed') {
        const tableData = filteredTests.map(test => [
          new Date(test.test_date).toLocaleDateString('pt-BR'),
          formatters.cooperDistance(test.cooper_test_distance),
          formatters.vo2Max(test.vo2_max),
          test.evaluation,
          test.notes || '-'
        ]);
        
        pdf.autoTable({
          startY: 200,
          head: [['Data', 'Distância Cooper', 'VO2 Máximo', 'Avaliação', 'Observações']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
    } else {
      pdf.text('Nenhum teste encontrado no período selecionado.', 20, 115);
    }
    
    pdf.save(`relatorio_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateGroupReport = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Geral de Performance', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Período: ${getPeriodLabel(options.period)}`, 20, 40);
    pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50);
    
    // Estatísticas gerais
    const allTests: PerformanceTest[] = [];
    const studentsWithTests = students.filter(student => {
      const filteredTests = filterTestsByPeriod(student.tests, options.period);
      allTests.push(...filteredTests);
      return filteredTests.length > 0;
    });
    
    pdf.setFontSize(14);
    pdf.text('Estatísticas Gerais', 20, 70);
    
    pdf.setFontSize(12);
    pdf.text(`Total de alunos: ${students.length}`, 20, 85);
    pdf.text(`Alunos com testes no período: ${studentsWithTests.length}`, 20, 95);
    pdf.text(`Total de testes realizados: ${allTests.length}`, 20, 105);
    
    if (allTests.length > 0) {
      const avgCooper = allTests.reduce((sum, test) => sum + test.cooper_test_distance, 0) / allTests.length;
      const avgVO2 = allTests.reduce((sum, test) => sum + test.vo2_max, 0) / allTests.length;
      
      pdf.text(`Distância Cooper média: ${formatters.cooperDistance(avgCooper)}`, 20, 115);
      pdf.text(`VO2 Máximo médio: ${formatters.vo2Max(avgVO2)}`, 20, 125);
      
      // Distribuição por avaliação
      const evaluationCounts: { [key: string]: number } = {};
      allTests.forEach(test => {
        evaluationCounts[test.evaluation] = (evaluationCounts[test.evaluation] || 0) + 1;
      });
      
      pdf.setFontSize(14);
      pdf.text('Distribuição por Avaliação', 20, 145);
      
      pdf.setFontSize(12);
      let yPos = 160;
      Object.entries(evaluationCounts).forEach(([evaluation, count]) => {
        const percentage = ((count / allTests.length) * 100).toFixed(1);
        pdf.text(`${evaluation}: ${count} (${percentage}%)`, 20, yPos);
        yPos += 10;
      });
      
      // Tabela resumida por aluno
      if (options.format === 'detailed') {
        const tableData = studentsWithTests.map(student => {
          const tests = filterTestsByPeriod(student.tests, options.period);
          const latestTest = tests[tests.length - 1];
          const age = calculateAge(student.birth_date);
          
          return [
            student.name,
            `${age}`,
            student.gender === 'M' ? 'M' : 'F',
            `${tests.length}`,
            formatters.cooperDistance(latestTest.cooper_test_distance),
            formatters.vo2Max(latestTest.vo2_max),
            latestTest.evaluation
          ];
        });
        
        pdf.autoTable({
          startY: yPos + 20,
          head: [['Nome', 'Idade', 'Gênero', 'Testes', 'Última Distância', 'Último VO2', 'Última Avaliação']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
    }
    
    pdf.save(`relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateComparisonReport = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Comparativo de Performance', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Período: ${getPeriodLabel(options.period)}`, 20, 40);
    pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50);
    
    // Análise por faixa etária e gênero
    const groups: { [key: string]: PerformanceTest[] } = {};
    
    students.forEach(student => {
      const tests = filterTestsByPeriod(student.tests, options.period);
      if (tests.length > 0) {
        const age = calculateAge(student.birth_date);
        const ageGroup = getAgeGroup(age);
        const key = `${ageGroup}_${student.gender}`;
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(...tests);
      }
    });
    
    pdf.setFontSize(14);
    pdf.text('Análise por Grupo Demográfico', 20, 70);
    
    let yPos = 85;
    Object.entries(groups).forEach(([groupKey, tests]) => {
      const [ageGroup, gender] = groupKey.split('_');
      const avgCooper = tests.reduce((sum, test) => sum + test.cooper_test_distance, 0) / tests.length;
      const avgVO2 = tests.reduce((sum, test) => sum + test.vo2_max, 0) / tests.length;
      
      pdf.setFontSize(12);
      pdf.text(`${getAgeGroupLabel(ageGroup)} - ${gender === 'M' ? 'Masculino' : 'Feminino'}:`, 20, yPos);
      pdf.text(`  Testes: ${tests.length}`, 30, yPos + 10);
      pdf.text(`  Cooper médio: ${formatters.cooperDistance(avgCooper)}`, 30, yPos + 20);
      pdf.text(`  VO2 médio: ${formatters.vo2Max(avgVO2)}`, 30, yPos + 30);
      
      yPos += 50;
    });
    
    pdf.save(`relatorio_comparativo_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getAgeGroup = (age: number): string => {
    if (age < 18) return 'under18';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    return 'over45';
  };

  const getAgeGroupLabel = (group: string): string => {
    const labels: { [key: string]: string } = {
      'under18': 'Menor de 18',
      '18-25': '18-25 anos',
      '26-35': '26-35 anos',
      '36-45': '36-45 anos',
      'over45': 'Acima de 45'
    };
    return labels[group] || group;
  };

  const getPeriodLabel = (period: string): string => {
    const labels: { [key: string]: string } = {
      'last30': 'Últimos 30 dias',
      'last90': 'Últimos 90 dias',
      'last180': 'Últimos 180 dias',
      'all': 'Todo o período'
    };
    return labels[period] || period;
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    
    try {
      await loadStudents();
      
      switch (options.type) {
        case 'individual':
          if (selectedStudent) {
            await generateIndividualReport(selectedStudent);
          }
          break;
        case 'group':
          await generateGroupReport();
          break;
        case 'comparison':
          await generateComparisonReport();
          break;
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Exportar Relatórios</h3>
            <p className="text-blue-100 text-sm">Gere relatórios detalhados em PDF sobre a performance dos alunos</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Opções do Relatório */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
            <Select value={options.type} onValueChange={(value: 'individual' | 'group' | 'comparison') => setOptions({...options, type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Individual</span>
                  </div>
                </SelectItem>
                <SelectItem value="group">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Geral (Todos os alunos)</span>
                  </div>
                </SelectItem>
                <SelectItem value="comparison">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Comparativo</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Período</label>
            <Select value={options.period} onValueChange={(value: 'last30' | 'last90' | 'last180' | 'all') => setOptions({...options, period: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Últimos 30 dias</span>
                  </div>
                </SelectItem>
                <SelectItem value="last90">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Últimos 90 dias</span>
                  </div>
                </SelectItem>
                <SelectItem value="last180">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Últimos 180 dias</span>
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Todo o período</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Formato</label>
            <Select value={options.format} onValueChange={(value: 'summary' | 'detailed') => setOptions({...options, format: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumido</SelectItem>
                <SelectItem value="detailed">Detalhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {options.type === 'individual' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Aluno</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent} onOpenChange={() => loadStudents()}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Prévia do Relatório */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-2">Prévia do Relatório</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{options.type === 'individual' ? 'Individual' : options.type === 'group' ? 'Geral' : 'Comparativo'}</Badge>
              <Badge variant="outline">{getPeriodLabel(options.period)}</Badge>
              <Badge variant="outline">{options.format === 'summary' ? 'Resumido' : 'Detalhado'}</Badge>
            </div>
            
            {options.type === 'individual' && selectedStudent && (
              <p>Aluno: {students.find(s => s.id === selectedStudent)?.name}</p>
            )}
            
            <p>Incluirá: Estatísticas de performance, {options.format === 'detailed' ? 'tabelas detalhadas, ' : ''}gráficos e análises</p>
          </div>
        </div>
        
        {/* Botão de Gerar */}
        <Button 
          onClick={handleGenerateReport} 
          disabled={loading || (options.type === 'individual' && !selectedStudent)}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Gerando relatório...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Gerar Relatório PDF</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}