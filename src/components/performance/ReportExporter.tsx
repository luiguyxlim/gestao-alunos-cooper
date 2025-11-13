'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, Users, TrendingUp } from 'lucide-react';
import { formatters } from '@/lib/performance-utils';
import { createClient } from '@/lib/supabase';
import { fetchStudentsWithTests, type ReportStudent, type NormalizedTest } from '@/lib/reports';
import { cooperColumns, prescriptionColumns, intervalColumns, type ColumnMetadata } from '@/lib/report-columns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportOptions {
  type: 'individual' | 'group' | 'comparison';
  period: 'last30' | 'last90' | 'last180' | 'all';
  format: 'summary' | 'detailed';
  includeCharts: boolean;
  includePerf: boolean;
  includePresc: boolean;
}

// Using NormalizedTest from reports.ts
type PerformanceTest = NormalizedTest

// number parsing handled in reports util

const formatPercentageValue = (value: number | null): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value.toFixed(0)}%`
  }
  return 'N/A'
}

const formatNumberWithUnit = (value: number | null, unit: string, fractionDigits = 1): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value.toFixed(fractionDigits)} ${unit}`
  }
  return 'N/A'
}

const formatMetersPerMinute = (value: number | null): string => formatNumberWithUnit(value, 'm/min', 2)
const formatLiters = (value: number | null): string => formatNumberWithUnit(value, 'L', 2)

export default function ReportExporter() {
  const [options, setOptions] = useState<ReportOptions>({
    type: 'group',
    period: 'last90',
    format: 'summary',
    includeCharts: false,
    includePerf: true,
    includePresc: true
  });
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<ReportStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadStudents = useCallback(async (): Promise<ReportStudent[]> => {
    if (studentsLoaded && students.length > 0) {
      return students;
    }

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw authError || new Error('Usuário não autenticado');
      }

      const studentsData = await fetchStudentsWithTests(authData.user.id, options.period)

      setStudents(studentsData);
      setStudentsLoaded(true);
      return studentsData;
    } catch (error) {
      const normalizedError = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
      console.error('Erro ao carregar alunos:', {
        error,
        message: normalizedError.message,
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
      });
      return students;
    }
  }, [studentsLoaded, students, options.period]);

  useEffect(() => {
    if (isClient && !studentsLoaded) {
      loadStudents();
    }
  }, [isClient, studentsLoaded, loadStudents]);

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    if (Number.isNaN(birth.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

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

  // Helper: Get value from test by column key
  const getColumnValue = (test: PerformanceTest, columnKey: string): unknown => {
    return (test as unknown as Record<string, unknown>)[columnKey]
  }

  // Helper: Build table data from tests using column metadata
  const buildTableData = (tests: PerformanceTest[], columns: ColumnMetadata[]): string[][] => {
    return tests.map(test => 
      columns.map(col => {
        const value = getColumnValue(test, col.key)
        if (col.formatter) {
          // Convert unknown to number | string | null for formatter
          const formattedValue = (typeof value === 'number' || typeof value === 'string' || value === null) ? value : null
          return col.formatter(formattedValue)
        }
        return value?.toString() || 'N/A'
      })
    )
  }

  // Helper: Get table headers from column metadata
  const getTableHeaders = (columns: ColumnMetadata[]): string[] => {
    return columns.map(col => col.unit ? `${col.label} (${col.unit})` : col.label)
  }

  // Geração de XLSX otimizado por áreas (Cooper / Prescrição / Intervalos)
  const generateXLSXReport = async () => {
    const currentStudents = students.length > 0 ? students : await loadStudents();

    const wb = XLSX.utils.book_new();

    const dateLabel = new Date().toISOString().split('T')[0];

    const formatDateBR = (value: unknown): string => {
      if (!value) return 'N/A';
      if (typeof value === 'string') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('pt-BR');
      }
      return 'N/A';
    };

    // Helper para anexar planilha
    const appendSheet = (name: string, headers: string[], rows: (string | number)[][]) => {
      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // Planilha Cooper
    {
      const headers = ['Nome', 'Idade', 'Gênero', ...getTableHeaders(cooperColumns), 'Observações'];
      const rows: (string | number)[][] = [];
      currentStudents.forEach(student => {
        const tests = filterTestsByPeriod(student.tests, options.period);
        const cooperTests = tests.filter(t => (t.test_type || '').toLowerCase().includes('cooper'));
        const age = calculateAge(student.birth_date);

        cooperTests.forEach(test => {
          const base = [
            student.name,
            typeof age === 'number' ? age : 'N/A',
            formatGender(student.gender),
            ...cooperColumns.map(col => {
              const v = getColumnValue(test, col.key);
              const fv = (typeof v === 'number' || typeof v === 'string' || v === null) ? v : null;
              return col.formatter ? col.formatter(fv) : (v?.toString() || '');
            }),
            test.notes ? String(test.notes) : ''
          ];
          rows.push(base as (string | number)[]);
        });
      });
      appendSheet('Cooper', headers, rows);
    }

    // Planilha Prescrição
    {
      const headers = ['Nome', 'Idade', 'Gênero', ...getTableHeaders(prescriptionColumns), 'Observações'];
      const rows: (string | number)[][] = [];
      currentStudents.forEach(student => {
        const tests = filterTestsByPeriod(student.tests, options.period);
        const prescTests = tests.filter(t => (t.test_type || '').toLowerCase().includes('performance'));
        const age = calculateAge(student.birth_date);

        prescTests.forEach(test => {
          const base = [
            student.name,
            typeof age === 'number' ? age : 'N/A',
            formatGender(student.gender),
            ...prescriptionColumns.map(col => {
              const v = getColumnValue(test, col.key);
              const fv = (typeof v === 'number' || typeof v === 'string' || v === null) ? v : null;
              return col.formatter ? col.formatter(fv) : (v?.toString() || '');
            }),
            test.notes ? String(test.notes) : ''
          ];
          rows.push(base as (string | number)[]);
        });
      });
      appendSheet('Prescrição', headers, rows);
    }

    // Planilha Intervalos (detalhe por intervalo)
    {
      const headers = ['Nome', 'Idade', 'Gênero', 'Data', ...getTableHeaders(intervalColumns)];
      const rows: (string | number)[][] = [];
      currentStudents.forEach(student => {
        const tests = filterTestsByPeriod(student.tests, options.period);
        const intervalTests = tests.filter(t => (t.test_type || '').toLowerCase().includes('interval'));
        const age = calculateAge(student.birth_date);

        intervalTests.forEach(test => {
          (test.intervals || []).forEach(intv => {
            const row = [
              student.name,
              typeof age === 'number' ? age : 'N/A',
              formatGender(student.gender),
              formatDateBR(test.test_date),
              ...intervalColumns.map(col => {
                const raw = (intv as unknown as Record<string, unknown>)[col.key];
                const fv = (typeof raw === 'number' || typeof raw === 'string' || raw === null) ? raw : null;
                return col.formatter ? col.formatter(fv) : (raw?.toString() || '');
              })
            ];
            rows.push(row as (string | number)[]);
          });
        });
      });
      appendSheet('Intervalos', headers, rows);
    }

    // Salvar arquivo
    XLSX.writeFile(wb, `relatorio_performance_${dateLabel}.xlsx`);
  };

  const generateIndividualReport = async (studentId: string) => {
    const currentStudents = students.length > 0 ? students : await loadStudents();
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return;
    
    const filteredTests = filterTestsByPeriod(student.tests, options.period);
    const performanceTests = filteredTests.filter(test => {
      const type = (test.test_type || '').toLowerCase();
      return type.includes('cooper');
    });

    const prescriptionTests = filteredTests.filter(test => {
      const type = (test.test_type || '').toLowerCase();
      return type.includes('performance');
    });
    
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'normal');
    pdf.setFont('helvetica', 'normal');
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Individual de Performance', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`${student.name}`, pageWidth / 2, 35, { align: 'center' });
    
    // Informações do aluno
    pdf.setFontSize(12);
    const age = calculateAge(student.birth_date);
    pdf.text(`Idade: ${age !== null ? `${age} anos` : 'Não informada'}`, 20, 55);
    pdf.text(`Gênero: ${formatGender(student.gender)}`, 20, 65);
    pdf.text(`Email: ${student.email || 'Não informado'}`, 20, 75);
    pdf.text(`Período: ${formatters.getPeriodLabel(options.period)}`, 20, 85);
    pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 95);
    
    if (filteredTests.length === 0) {
      pdf.text('Nenhum teste encontrado no período selecionado.', 20, 115);
    }

    let currentY = 110;

    if (options.includePerf && performanceTests.length > 0) {
      pdf.setFontSize(18);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Testes de Performance (Cooper/VO₂)', 20, currentY);
      pdf.setTextColor(0, 0, 0);
      currentY += 10;

      const latestPerf = performanceTests[performanceTests.length - 1];
      const firstPerf = performanceTests[0];

      const performanceSummaryRows = [
        ['Total de testes', `${performanceTests.length}`],
        ['Último teste', new Date(latestPerf.test_date).toLocaleDateString('pt-BR')],
        ['Distância Cooper atual', formatDistance(latestPerf.cooper_test_distance)],
        ['VO₂ Máximo atual', formatVo2(latestPerf.vo2_max)]
      ];

      if (performanceTests.length > 1) {
        const improvement = calculateImprovement(firstPerf.cooper_test_distance, latestPerf.cooper_test_distance);
        performanceSummaryRows.push(['Melhoria no período', improvement]);
      }

      autoTable(pdf, {
        startY: currentY,
        head: [['Indicador', 'Valor']],
        body: performanceSummaryRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        styles: { font: 'helvetica', fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [239, 246, 255] }
      });

      currentY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 10;

      if (options.format === 'detailed') {
        const performanceTableData = buildTableData(performanceTests, cooperColumns)
        
        // Add notes column manually since it's not in cooperColumns metadata
        const tableDataWithNotes = performanceTableData.map((row, idx) => [
          ...row,
          performanceTests[idx].notes || '-'
        ])
        const headers = [...getTableHeaders(cooperColumns), 'Observações']

        autoTable(pdf, {
          startY: currentY,
          head: [headers],
          body: tableDataWithNotes,
          theme: 'striped',
          headStyles: { fillColor: [29, 78, 216], textColor: 255 },
          styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
          alternateRowStyles: { fillColor: [240, 249, 255] }
        });

        currentY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 15;
      }
    }

    if (options.includePresc && prescriptionTests.length > 0) {
      pdf.setFontSize(18);
      pdf.setTextColor(124, 58, 237);
      pdf.text('Prescrição de Treino', 20, currentY);
      pdf.setTextColor(0, 0, 0);
      currentY += 10;

      const latestPrescription = prescriptionTests[prescriptionTests.length - 1];

      // Build summary using prescription columns metadata
      const prescriptionSummary = [
        ['Última prescrição', new Date(latestPrescription.test_date).toLocaleDateString('pt-BR')],
        ['VO₂ Máximo base', formatVo2(latestPrescription.vo2_max)]
      ]
      
      // Add key prescription columns to summary
      prescriptionColumns.forEach(col => {
        if (col.key === 'test_date') return // Already added
        const value = getColumnValue(latestPrescription, col.key)
        if (value !== null && value !== undefined) {
          const label = col.unit ? `${col.label} (${col.unit})` : col.label
          const formattedValue = (typeof value === 'number' || typeof value === 'string' || value === null) ? value : null
          const formatted = col.formatter ? col.formatter(formattedValue) : String(value)
          prescriptionSummary.push([label, formatted])
        }
      })

      autoTable(pdf, {
        startY: currentY,
        head: [['Indicador', 'Valor']],
        body: prescriptionSummary,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255 },
        styles: { font: 'helvetica', fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 243, 255] }
      });

      currentY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 10;

      if (options.format === 'detailed') {
        const prescriptionTableData = buildTableData(prescriptionTests, prescriptionColumns)
        
        // Add notes column manually since it's not in prescriptionColumns metadata
        const tableDataWithNotes = prescriptionTableData.map((row, idx) => [
          ...row,
          prescriptionTests[idx].notes || '-'
        ])
        const headers = [...getTableHeaders(prescriptionColumns), 'Observações']

        autoTable(pdf, {
          startY: currentY,
          head: [headers],
          body: tableDataWithNotes,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [240, 245, 255] }
        });
      }
    }

    // Treino Intervalado
    const intervalTests = filteredTests.filter(test => {
      const type = (test.test_type || '').toLowerCase();
      return type.includes('interval');
    })

    if (options.includePresc && intervalTests.length > 0) {
      pdf.setFontSize(18);
      pdf.setTextColor(16, 185, 129);
      pdf.text('Treino Intervalado', 20, currentY);
      pdf.setTextColor(0, 0, 0);
      currentY += 10;

      const latestInterval = intervalTests[intervalTests.length - 1];

      const intervalSummary: string[][] = [
        ['Último treino intervalado', new Date(latestInterval.test_date).toLocaleDateString('pt-BR')],
        ['VO₂ Máximo base', formatVo2(latestInterval.vo2_max)]
      ];

      // Reutiliza colunas de prescrição para exibir o resumo agregado do treino intervalado
      prescriptionColumns.forEach(col => {
        if (col.key === 'test_date') return;
        const value = getColumnValue(latestInterval, col.key);
        if (value !== null && value !== undefined) {
          const label = col.unit ? `${col.label} (${col.unit})` : col.label;
          const formattedValue = (typeof value === 'number' || typeof value === 'string' || value === null) ? value : null;
          const formatted = col.formatter ? col.formatter(formattedValue) : String(value);
          intervalSummary.push([label, formatted]);
        }
      })

      autoTable(pdf, {
        startY: currentY,
        head: [['Indicador', 'Valor']],
        body: intervalSummary,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { font: 'helvetica', fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [236, 253, 245] }
      });

      currentY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 10;

      if (options.format === 'detailed') {
        // Tabela detalhada de intervalos (agregando todos os testes do período)
        const headers = ['Data', ...getTableHeaders(intervalColumns)];
        const body: string[][] = [];

        intervalTests.forEach(test => {
          const dateLabel = new Date(test.test_date).toLocaleDateString('pt-BR');
          const rows = (test.intervals || []).map(intv => {
            const values = intervalColumns.map(col => {
              const raw = (intv as unknown as Record<string, unknown>)[col.key];
              if (col.formatter) {
                const fv = (typeof raw === 'number' || typeof raw === 'string' || raw === null) ? raw : null;
                return col.formatter(fv);
              }
              return raw?.toString() || 'N/A';
            });
            return [dateLabel, ...values];
          })
          body.push(...rows);
        })

        autoTable(pdf, {
          startY: currentY,
          head: [headers],
          body,
          theme: 'striped',
          headStyles: { fillColor: [5, 150, 105], textColor: 255 },
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [240, 253, 244] }
        });

        currentY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 15;
      }
    }

    
    pdf.save(`relatorio_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateGroupReport = async () => {
    const currentStudents = students.length > 0 ? students : await loadStudents();
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'normal');
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Geral de Performance', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Período: ${formatters.getPeriodLabel(options.period)}`, 20, 40);
    pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50);
    
    // Estatísticas gerais
    const allTests: PerformanceTest[] = [];
    const studentsWithTests = currentStudents.filter(student => {
      const filteredTests = filterTestsByPeriod(student.tests, options.period).filter(hasValidMetrics);
      allTests.push(...filteredTests);
      return filteredTests.length > 0;
    });
    
    const summaryRows = [
      ['Total de alunos', `${currentStudents.length}`],
      ['Alunos com testes no período', `${studentsWithTests.length}`],
      ['Total de testes realizados', `${allTests.length}`]
    ];
    
    if (allTests.length > 0) {
      const avgCooper = averageMetric(allTests.map(test => test.cooper_test_distance));
      const avgVO2 = averageMetric(allTests.map(test => test.vo2_max));
      
      summaryRows.push(['Distância Cooper média', formatDistance(avgCooper)]);
      summaryRows.push(['VO2 Máximo médio', formatVo2(avgVO2)]);
      const presc = allTests.filter(t => (t.test_type || '').toLowerCase().includes('performance'))
      if (presc.length > 0) {
        const avgInt = averageMetric(presc.map(t => t.intensity_percentage))
        const avgVel = averageMetric(presc.map(t => t.training_velocity))
        const avgO2  = averageMetric(presc.map(t => t.total_o2_consumption))
        if (avgInt !== null) summaryRows.push(['Intensidade média', `${Math.round(avgInt)}%`])
        if (avgVel !== null) summaryRows.push(['Velocidade média', formatMetersPerMinute(avgVel)])
        if (avgO2  !== null) summaryRows.push(['Consumo total de O₂ médio', formatLiters(avgO2)])
      }
    }
    
      autoTable(pdf, {
        startY: 70,
        head: [['Indicador', 'Valor']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 249, 255] }
      });

    const summaryFinalY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 110) + 10;

    if (options.format === 'detailed' && studentsWithTests.length > 0) {
      const perfRows = studentsWithTests.map(student => {
        const tests = filterTestsByPeriod(student.tests, options.period)
        const perf = tests.filter(t => (t.test_type || '').toLowerCase().includes('cooper'))
        const last = perf[perf.length - 1]
        const age = calculateAge(student.birth_date)
        return [
          student.name,
          age !== null ? `${age}` : 'N/A',
          formatGender(student.gender),
          last ? new Date(last.test_date).toLocaleDateString('pt-BR') : '—',
          last ? formatVo2(last.vo2_max) : 'N/A',
          last ? formatDistance(last.cooper_test_distance) : 'N/A'
        ]
      })

      autoTable(pdf, {
        startY: summaryFinalY,
        head: [['Nome', 'Idade', 'Gênero', 'Último Teste', 'VO₂', 'Distância']],
        body: perfRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [240, 249, 255] }
      })

      const afterPerfY = (((pdf as unknown) as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? summaryFinalY) + 12

      const prescRows = studentsWithTests.map(student => {
        const tests = filterTestsByPeriod(student.tests, options.period)
        const presc = tests.filter(t => (t.test_type || '').toLowerCase().includes('performance'))
        const last = presc[presc.length - 1]
        return [
          student.name,
          last ? new Date(last.test_date).toLocaleDateString('pt-BR') : '—',
          last ? formatPercentageValue(last.intensity_percentage) : 'N/A',
          last ? formatNumberWithUnit(last.training_time, 'min', 0) : 'N/A',
          last ? formatMetersPerMinute(last.training_velocity) : 'N/A',
          last ? formatLiters(last.total_o2_consumption) : 'N/A'
        ]
      })

      autoTable(pdf, {
        startY: afterPerfY,
        head: [['Aluno', 'Última Prescrição', '% Int', 'Tempo', 'Velocidade', 'Consumo O₂']],
        body: prescRows,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 243, 255] }
      })

      // Seção separada para Treino Intervalado
      const afterPrescY = (((pdf as unknown) as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? afterPerfY) + 12

      const intervalRows = studentsWithTests.map(student => {
        const tests = filterTestsByPeriod(student.tests, options.period)
        const intervals = tests.filter(t => isIntervalTest(t))
        const last = intervals[intervals.length - 1]
        return [
          student.name,
          last ? new Date(last.test_date).toLocaleDateString('pt-BR') : '—',
          last ? formatPercentageValue(last.intensity_percentage) : 'N/A',
          last ? formatNumberWithUnit(last.training_time, 'min', 0) : 'N/A',
          last ? formatMetersPerMinute(last.training_velocity) : 'N/A',
          last ? formatLiters(last.total_o2_consumption) : 'N/A'
        ]
      })

      autoTable(pdf, {
        startY: afterPrescY,
        head: [['Aluno', 'Último Treino', '% Int', 'Tempo', 'Velocidade', 'Consumo O₂']],
        body: intervalRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [236, 253, 245] }
      })
    }

    pdf.save(`relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateComparisonReport = async () => {
    const currentStudents = students.length > 0 ? students : await loadStudents();
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'normal');
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Comparativo de Performance', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Período: ${formatters.getPeriodLabel(options.period)}`, 20, 40);
    pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50);
    
    // Análise por faixa etária e gênero separada por tipo de teste
    const groups: { [key: string]: { cooper: PerformanceTest[]; prescription: PerformanceTest[]; interval: PerformanceTest[] } } = {};

    currentStudents.forEach(student => {
      const tests = filterTestsByPeriod(student.tests, options.period)
      if (tests.length > 0) {
        const age = calculateAge(student.birth_date)
        const ageGroup = getAgeGroup(age ?? -1)
        const key = `${ageGroup}_${formatGender(student.gender)}`

        if (!groups[key]) groups[key] = { cooper: [], prescription: [], interval: [] }
        tests.forEach(t => {
          if (isCooperTest(t)) groups[key].cooper.push(t)
          if (isPrescriptionTest(t)) groups[key].prescription.push(t)
          if (isIntervalTest(t)) groups[key].interval.push(t)
        })
      }
    })

    // Seção Cooper
    const cooperRows = Object.entries(groups).map(([groupKey, bucket]) => {
      const [ageGroup, gender] = groupKey.split('_')
      const avgCooper = averageMetric(bucket.cooper.map(test => test.cooper_test_distance))
      const avgVO2 = averageMetric(bucket.cooper.map(test => test.vo2_max))
      return [
        `${getAgeGroupLabel(ageGroup)} / ${gender}`,
        `${bucket.cooper.length}`,
        formatDistance(avgCooper),
        formatVo2(avgVO2)
      ]
    }).filter(row => row[1] !== '0')

    if (cooperRows.length > 0) {
      autoTable(pdf, {
        startY: 70,
        head: [['Grupo', 'Testes Cooper', 'Cooper médio', 'VO₂ médio']],
        body: cooperRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        styles: { fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [240, 249, 255] }
      })
    }

    let afterCooperY = (((pdf as unknown) as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 110) + 12

    // Seção Prescrição
    const prescRows = Object.entries(groups).map(([groupKey, bucket]) => {
      const [ageGroup, gender] = groupKey.split('_')
      const avgVel = averageMetric(bucket.prescription.map(t => t.training_velocity))
      const avgO2 = averageMetric(bucket.prescription.map(t => t.total_o2_consumption))
      return [
        `${getAgeGroupLabel(ageGroup)} / ${gender}`,
        `${bucket.prescription.length}`,
        avgVel !== null ? formatMetersPerMinute(avgVel) : 'N/A',
        avgO2 !== null ? formatLiters(avgO2) : 'N/A'
      ]
    }).filter(row => row[1] !== '0')

    if (prescRows.length > 0) {
      autoTable(pdf, {
        startY: afterCooperY,
        head: [['Grupo', 'Prescrições', 'Velocidade média', 'Consumo O₂ médio']],
        body: prescRows,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255 },
        styles: { fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 243, 255] }
      })
      afterCooperY = (((pdf as unknown) as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? afterCooperY) + 12
    }

    // Seção Intervalado
    const intervalRows = Object.entries(groups).map(([groupKey, bucket]) => {
      const [ageGroup, gender] = groupKey.split('_')
      const avgVel = averageMetric(bucket.interval.map(t => t.training_velocity))
      const avgTime = averageMetric(bucket.interval.map(t => t.training_time))
      const avgDist = averageMetric(bucket.interval.map(t => t.training_distance))
      return [
        `${getAgeGroupLabel(ageGroup)} / ${gender}`,
        `${bucket.interval.length}`,
        avgTime !== null ? formatNumberWithUnit(avgTime, 'min', 0) : 'N/A',
        avgDist !== null ? formatNumberWithUnit(avgDist, 'm', 0) : 'N/A',
        avgVel !== null ? formatMetersPerMinute(avgVel) : 'N/A'
      ]
    }).filter(row => row[1] !== '0')

    if (intervalRows.length > 0) {
      autoTable(pdf, {
        startY: afterCooperY,
        head: [['Grupo', 'Intervalados', 'Tempo médio', 'Distância média', 'Velocidade média']],
        body: intervalRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 11, cellPadding: 3 },
        alternateRowStyles: { fillColor: [236, 253, 245] }
      })
    }

    if (cooperRows.length === 0 && prescRows.length === 0 && intervalRows.length === 0) {
      pdf.setFontSize(12)
      pdf.text('Sem dados suficientes para gerar a análise comparativa.', 20, 80)
    }
    
    pdf.save(`relatorio_comparativo_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatGender = (gender: string | null): string => {
    if (!gender) return 'Não informado'
    const normalized = gender.toLowerCase()
    if (normalized.startsWith('m')) return 'Masculino'
    if (normalized.startsWith('f')) return 'Feminino'
    return 'Outro'
  }
  const formatDistance = (value: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
    return formatters.cooperDistance(value)
  }
  const formatVo2 = (value: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
    return formatters.vo2Max(value)
  }
  const hasValidMetrics = (test: PerformanceTest): boolean => {
    return (typeof test.cooper_test_distance === 'number' && !Number.isNaN(test.cooper_test_distance)) ||
      (typeof test.vo2_max === 'number' && !Number.isNaN(test.vo2_max))
  }
  // Identificação consistente do tipo de teste
  const normalizeType = (t: string | null): string => (t || '').toLowerCase()
  const isCooperTest = (test: PerformanceTest): boolean => {
    const type = normalizeType(test.test_type)
    return type.includes('cooper') ||
      (typeof test.cooper_test_distance === 'number' || typeof test.vo2_max === 'number')
  }
  const isPrescriptionTest = (test: PerformanceTest): boolean => {
    const type = normalizeType(test.test_type)
    return type.includes('performance') || type.includes('prescription')
  }
  const isIntervalTest = (test: PerformanceTest): boolean => {
    const type = normalizeType(test.test_type)
    return type.includes('interval')
  }
  const averageMetric = (values: Array<number | null>): number | null => {
    const valid = values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
    if (valid.length === 0) return null
    return valid.reduce((sum, value) => sum + value, 0) / valid.length
  }
  const calculateImprovement = (initial: number | null, latest: number | null): string => {
    if (typeof initial !== 'number' || typeof latest !== 'number' || initial === 0) return 'N/A'
    const change = ((latest - initial) / initial) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getAgeGroup = (age: number): string => {
    if (age < 18) return 'under18';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    return 'over45';
  };

  const getAgeGroupLabel = (group: string): string => {
    const labels: { [key: string]: string } = {
      under18: 'Menor de 18',
      '18-25': '18-25 anos',
      '26-35': '26-35 anos',
      '36-45': '36-45 anos',
      over45: 'Acima de 45'
    }
    return labels[group] || group
  }

  const generateCSVReport = async () => {
    const currentStudents = students.length > 0 ? students : await loadStudents();

    // Build CSV headers from all report columns
    const headers = ['Nome', 'Idade', 'Gênero', 'Tipo de Teste', 'Seção']
    const allKeys = new Set<string>()
    cooperColumns.forEach(col => allKeys.add(col.key))
    prescriptionColumns.forEach(col => allKeys.add(col.key))
    intervalColumns.forEach(col => allKeys.add(col.key))
    
    // Get unique column labels with units
    allKeys.forEach(key => {
      const cooperCol = cooperColumns.find(c => c.key === key)
      const prescCol = prescriptionColumns.find(c => c.key === key)
      const intervalCol = intervalColumns.find(c => c.key === key)
      const col = cooperCol || prescCol || intervalCol
      if (col) {
        const label = col.unit ? `${col.label} (${col.unit})` : col.label
        headers.push(label)
      }
    })
    headers.push('Observações')
    
    let csvContent = headers.join(',') + '\n';
    
    currentStudents.forEach(student => {
      const tests = filterTestsByPeriod(student.tests, options.period);
      const age = calculateAge(student.birth_date);
      
      if (tests.length > 0) {
        tests.forEach(test => {
          // Determine test type
          const testType = (test.test_type || '').toLowerCase();
          const typeLabel = testType.includes('cooper')
            ? 'Cooper'
            : testType.includes('performance')
            ? 'Prescrição'
            : testType.includes('interval')
            ? 'Treino Intervalado'
            : 'Outro';

          const intervalKeys = new Set(intervalColumns.map(c => c.key));

          // Summary row (test-level data)
          const baseRow = [
            `"${student.name}"`,
            age?.toString() || 'N/A',
            formatGender(student.gender),
            typeLabel,
            'Resumo'
          ];

          allKeys.forEach(key => {
            const value = getColumnValue(test, key);
            if (value === null || value === undefined || intervalKeys.has(key)) {
              baseRow.push('');
            } else {
              const cooperCol = cooperColumns.find(c => c.key === key);
              const prescCol = prescriptionColumns.find(c => c.key === key);
              const col = cooperCol || prescCol;
              if (col?.formatter) {
                const formattedValue = (typeof value === 'number' || typeof value === 'string' || value === null) ? value : null;
                baseRow.push(col.formatter(formattedValue));
              } else {
                baseRow.push(String(value));
              }
            }
          });
          baseRow.push(`"${test.notes || ''}"`);
          csvContent += baseRow.join(',') + '\n';

          // Interval rows (if interval training)
          if (testType.includes('interval')) {
            (test.intervals || []).forEach((intv) => {
              const row = [
                `"${student.name}"`,
                age?.toString() || 'N/A',
                formatGender(student.gender),
                typeLabel,
                `Intervalo ${intv.order_index ?? ''}`
              ];
              allKeys.forEach(key => {
                const raw = (intv as unknown as Record<string, unknown>)[key];
                if (raw === null || raw === undefined) {
                  row.push('');
                } else {
                  const intervalCol = intervalColumns.find(c => c.key === key);
                  if (intervalCol?.formatter) {
                    const fv = (typeof raw === 'number' || typeof raw === 'string' || raw === null) ? raw : null;
                    row.push(intervalCol.formatter(fv));
                  } else {
                    row.push(String(raw));
                  }
                }
              });
              row.push(''); // observações não se aplicam por intervalo
              csvContent += row.join(',') + '\n';
            });
          }
        });
      } else {
        const row = [
          `"${student.name}"`,
          age?.toString() || 'N/A',
          formatGender(student.gender),
          '',
          'Resumo',
          ...Array(allKeys.size).fill(''),
          ''
        ];
        csvContent += row.join(',') + '\n';
      }
    });
    
    // Download do arquivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_performance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    
    try {
      const currentStudents = await loadStudents();
      switch (options.type) {
        case 'individual':
          if (selectedStudent) {
            await generateIndividualReport(selectedStudent);
          }
          break;
        case 'group':
          if (currentStudents.length === 0) {
            console.warn('Nenhum aluno encontrado para gerar o relatório.');
          } else {
            await generateGroupReport();
          }
          break;
        case 'comparison':
          if (currentStudents.length === 0) {
            console.warn('Nenhum aluno encontrado para gerar o relatório.');
          } else {
            await generateComparisonReport();
          }
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
            <p className="text-blue-100 text-sm">Gere relatórios detalhados em PDF, CSV e XLSX sobre a performance dos alunos</p>
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

        {/* Opções extras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={options.includePerf} onChange={(e) => setOptions({ ...options, includePerf: e.target.checked })} />
            Incluir Testes de Performance
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={options.includePresc} onChange={(e) => setOptions({ ...options, includePresc: e.target.checked })} />
            Incluir Prescrições de Treino
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={options.format === 'detailed'} onChange={(e) => setOptions({ ...options, format: e.target.checked ? 'detailed' : 'summary' })} />
            Detalhar por aluno
          </label>
        </div>
        
        {/* Prévia do Relatório */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-2">Prévia do Relatório</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{options.type === 'individual' ? 'Individual' : options.type === 'group' ? 'Geral' : 'Comparativo'}</Badge>
              <Badge variant="outline">{formatters.getPeriodLabel(options.period)}</Badge>
              <Badge variant="outline">{options.format === 'summary' ? 'Resumido' : 'Detalhado'}</Badge>
            </div>
            
            {options.type === 'individual' && selectedStudent && (
              <p>Aluno: {students.find(s => s.id === selectedStudent)?.name}</p>
            )}
            
            <p>Incluirá: Estatísticas de performance, {options.format === 'detailed' ? 'tabelas detalhadas, ' : ''}gráficos e análises</p>
          </div>
        </div>
        
        {/* Botões de Exportação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={handleGenerateReport} 
            disabled={loading || (options.type === 'individual' && !selectedStudent)}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Gerar PDF</span>
              </div>
            )}
          </Button>
          
          <Button 
            onClick={generateCSVReport} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Exportar CSV</span>
            </div>
          </Button>

          <Button 
            onClick={generateXLSXReport} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Exportar XLSX</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}