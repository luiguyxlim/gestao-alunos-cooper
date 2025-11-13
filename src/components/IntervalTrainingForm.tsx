"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import type { Student } from '@/lib/types'
import ConfirmModal from '@/components/ConfirmModal'
import DebugLogger from '@/components/DebugLogger'
import { logger } from '@/lib/logger'
import { calculateIntervalTrainingResults, type IntervalInput } from '@/lib/interval-training'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createIntervalTrainingTestAction } from '@/lib/actions/interval-training'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

interface Props {
  students: Student[]
  selectedStudentId?: string
}

type IntervalMode = IntervalInput['mode']

type CooperTestRow = Pick<Database['public']['Tables']['performance_tests']['Row'], 'id' | 'test_date' | 'cooper_test_distance' | 'vo2_max'>

export default function IntervalTrainingForm({ students, selectedStudentId: preselectedStudentId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const initialSelectedId = preselectedStudentId ?? students[0]?.id ?? ''
  const initialSelectedStudent = students.find(s => s.id === initialSelectedId)
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialSelectedId)
  const [cooperTests, setCooperTests] = useState<CooperTestRow[]>([])
  const [selectedCooperDistance, setSelectedCooperDistance] = useState<number>(0)
  const [testDate, setTestDate] = useState<string>('')
  const [bodyWeight, setBodyWeight] = useState<number>(initialSelectedStudent?.weight ?? 70)
  const [notes, setNotes] = useState<string>('')
  const [intervals, setIntervals] = useState<IntervalInput[]>([
    { mode: 'distance_intensity', distanceMeters: 400, intensityPercentage: 80 },
  ])
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>('')

  // Evita mismatch de hidratação ao calcular a data somente no cliente
  useEffect(() => {
    setTestDate(new Date().toISOString().slice(0, 10))
  }, [])

  useEffect(() => {
    async function fetchCooper() {
      if (!selectedStudentId) return
      logger.supabaseInfo('Buscando testes de Cooper para aluno', { selectedStudentId })
      const { data, error } = await supabase
        .from('performance_tests')
        .select('id, test_date, cooper_test_distance, vo2_max')
        .eq('student_id', selectedStudentId)
        .eq('test_type', 'cooper_vo2')
        .order('test_date', { ascending: false })

      if (!error) {
        const rows = (data ?? []) as CooperTestRow[]
        setCooperTests(rows)
        const first = rows[0]
        setSelectedCooperDistance(first?.cooper_test_distance ?? 0)
        logger.supabaseDebug('Cooper tests carregados', { count: rows.length, first })
      } else {
        logger.supabaseError('Erro ao buscar Cooper tests', undefined, { error })
      }
    }
    fetchCooper()
  }, [selectedStudentId, supabase])

  // Herdar medidas do avaliando ao trocar o selecionado (não editáveis no teste)
  useEffect(() => {
    const s = students.find(st => st.id === selectedStudentId)
    const inheritedWeight = s?.weight ?? 0
    setBodyWeight(inheritedWeight)
    logger.info('FORM', 'Peso corporal herdado do cadastro do avaliando', { selectedStudentId, inheritedWeight })
  }, [selectedStudentId, students])

  const calc = useMemo(() => {
    if (!selectedCooperDistance || !bodyWeight || intervals.length === 0) return null
    return calculateIntervalTrainingResults(selectedCooperDistance, bodyWeight, intervals)
  }, [selectedCooperDistance, bodyWeight, intervals])

  const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']

  function addInterval() {
    setIntervals((prev) => {
      const used = new Set(prev.map((p) => p.dayOfWeek))
      const nextDay = days.find((d) => !used.has(d)) || days[0]
      if (used.size >= days.length) return prev
      return [...prev, { mode: 'distance_intensity', dayOfWeek: nextDay, distanceMeters: 200, intensityPercentage: 75, repetitions: 1, restSeconds: 0 }]
    })
  }

  function updateInterval(index: number, patch: Partial<IntervalInput>) {
    setIntervals((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeInterval(index: number) {
    setIntervals((prev) => prev.filter((_, i) => i !== index))
  }

  async function onConfirmSave() {
    try {
      setSaving(true)
      // Validações básicas para permitir log detalhado mesmo sem cálculo
      if (!selectedStudentId) {
        logger.supabaseWarn('Validação falhou: aluno não selecionado')
        alert('Selecione um aluno antes de salvar.')
        setSaving(false)
        setShowConfirm(false)
        return
      }
      if (!testDate) {
        logger.supabaseWarn('Validação falhou: data do teste vazia')
        alert('Informe a data do teste.')
        setSaving(false)
        setShowConfirm(false)
        return
      }
      if (intervals.length === 0) {
        logger.supabaseWarn('Validação falhou: nenhum intervalo informado')
        alert('Adicione pelo menos um intervalo.')
        setSaving(false)
        setShowConfirm(false)
        return
      }
      logger.supabaseInfo('Iniciando salvamento de teste intervalado', {
        student_id: selectedStudentId,
        test_date: testDate,
        cooper_distance: selectedCooperDistance,
        body_weight: bodyWeight,
        intervals_count: intervals.length,
      })
      const fd = new FormData()
      fd.set('student_id', selectedStudentId)
      fd.set('test_date', testDate)
      fd.set('cooper_distance', String(selectedCooperDistance))
      fd.set('body_weight', String(bodyWeight))
      fd.set('notes', notes)
      fd.set('intervals_json', JSON.stringify(intervals))
      const result = await createIntervalTrainingTestAction(fd) as { testId: string }
      logger.supabaseInfo('Teste intervalado salvo com sucesso', result)
      setShowConfirm(false)
      setSaving(false)
      setSaveMessage('Teste salvo com sucesso! Redirecionando...')
      // Navega para a página do teste criado após breve feedback
      setTimeout(() => {
        router.push(`/tests/${result.testId}`)
      }, 800)
    } catch (e) {
      console.error(e)
      setSaving(false)
      setShowConfirm(false)
      const msg = e instanceof Error ? e.message : 'Erro ao salvar o teste intervalado'
      logger.supabaseError('Falha ao salvar teste intervalado', e instanceof Error ? e : undefined, {
        student_id: selectedStudentId,
        test_date: testDate,
        cooper_distance: selectedCooperDistance,
        body_weight: bodyWeight,
        intervals_count: intervals.length,
      })
      alert(msg)
    }
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-lg mb-4">
          <span className="text-lg font-bold">Teste Intervalado</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Sessão com múltiplos treinos</h1>
        <p className="text-slate-600 text-lg">Baseada em teste de Cooper, com cálculo automático de métricas</p>
      </div>

      {/* Card: Parâmetros Iniciais */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Avaliando</label>
          <select
            className="w-full h-12 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data do teste</label>
          <input type="date" className="w-full h-12 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Peso corporal (kg)</label>
          <input
            type="number"
            step="0.1"
            className="w-full h-12 border-slate-200 rounded-xl border px-3 bg-slate-50 text-slate-700"
            value={bodyWeight}
            readOnly
            disabled
            aria-readonly="true"
            title="Peso herdado do cadastro do avaliando"
          />
          <p className="text-xs text-slate-500 mt-1">Medida herdada do cadastro do avaliando. Para alterar, edite o cadastro.</p>
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium mb-1">Base (Teste de Cooper)</label>
          <select className="w-full h-12 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3" value={selectedCooperDistance} onChange={(e) => setSelectedCooperDistance(parseFloat(e.target.value))}>
            {cooperTests.map((t) => (
              <option key={t.id} value={t.cooper_test_distance ?? 0}>
                {new Date(t.test_date).toLocaleDateString()} — {t.cooper_test_distance} m (VO2 {t.vo2_max ?? '-'} ml/kg/min)
              </option>
            ))}
            {cooperTests.length === 0 && (
              <option value={0}>Nenhum teste de Cooper encontrado</option>
            )}
          </select>
        </div>
        </div>
      </div>

      {/* Header de Treinos */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-900">Treinos</h2>
        <button type="button" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow" onClick={addInterval}>Adicionar treino</button>
      </div>

      <div className="space-y-3">
        {intervals.map((it, idx) => (
          <div key={idx} className="bg-white/90 backdrop-blur-sm shadow rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-7 gap-3 items-end overflow-hidden">
            <div>
              <label className="block text-sm font-medium mb-1">Modo</label>
              <div className="h-11 flex items-center px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700">
                Distância + Intensidade (%)
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dia da semana</label>
              <select className="w-full h-11 border-slate-200 rounded-xl border px-3" value={it.dayOfWeek ?? ''} onChange={(e) => updateInterval(idx, { dayOfWeek: e.target.value })}>
                {days.map((d) => (
                  <option key={d} value={d} disabled={intervals.some((x, i) => i !== idx && x.dayOfWeek === d)}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Distância (m)</label>
              <input type="number" className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3" value={it.distanceMeters} onChange={(e) => updateInterval(idx, { distanceMeters: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Intensidade (%)</label>
              <input type="number" className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3" value={it.intensityPercentage ?? 0} onChange={(e) => updateInterval(idx, { intensityPercentage: parseFloat(e.target.value), mode: 'distance_intensity', timeMinutes: undefined })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Repetições</label>
              <input type="number" className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3" value={it.repetitions ?? 1} onChange={(e) => updateInterval(idx, { repetitions: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descanso (s)</label>
              <input type="number" className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl border px-3" value={it.restSeconds ?? 0} onChange={(e) => updateInterval(idx, { restSeconds: parseFloat(e.target.value) })} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
              <button type="button" className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl w-full sm:w-auto" onClick={() => removeInterval(idx)}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Preview</h3>
        {!calc && <p className="text-sm text-gray-600">Preencha os campos para ver o preview.</p>}
        {calc && (
          <div className="space-y-3">
            <div className="text-sm text-gray-800">VO2máx: {calc.summary.vo2Max} ml/kg/min — MET máx: {calc.summary.maxMET}</div>
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Dia</th>
                  <th className="p-2 text-left">Distância (m)</th>
                  <th className="p-2 text-left">Intensidade (%)</th>
                  <th className="p-2 text-left">Reps</th>
                  <th className="p-2 text-left">Descanso (s)</th>
                  <th className="p-2 text-left">Tempo total (min)</th>
                  <th className="p-2 text-left">Tempo/rep (min:s)</th>
                  <th className="p-2 text-left">Vel (m/min)</th>
                  <th className="p-2 text-left">Pace (km/h)</th>
                </tr>
              </thead>
              <tbody>
                {calc.intervals.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{r.dayOfWeek}</td>
                    <td className="p-2">{r.distanceMeters}</td>
                    <td className="p-2">{r.intensityPercentage ?? '-'}</td>
                    <td className="p-2">{r.repetitions ?? 1}</td>
                    <td className="p-2">{r.restSeconds ?? 0}</td>
                    <td className="p-2">{r.timeMinutes}</td>
                    <td className="p-2">{(() => {
                      const tMin = r.velocityMPerMin && r.velocityMPerMin > 0 ? r.distanceMeters / r.velocityMPerMin : 0
                      const totalSec = Math.round(tMin * 60)
                      const m = Math.floor(totalSec / 60)
                      const s = totalSec % 60
                      const ss = s.toString().padStart(2, '0')
                      return `${m}:${ss}`
                    })()}</td>
                    <td className="p-2">{r.velocityMPerMin}</td>
                    <td className="p-2">{r.velocityKmPerHour}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Total distância: {calc.summary.totalDistanceMeters} m</div>
              <div>Total tempo: {calc.summary.totalTimeMinutes} min</div>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico reativo baseado nos intervalos */}
      {calc && (
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Gráfico de Intensidade e Velocidade</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={calc.intervals.map((r) => ({
                dia: r.dayOfWeek ?? '',
                intensidade: r.intensityPercentage ?? 0,
                velocidade: r.velocityMPerMin ?? 0,
              }))}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} label={{ value: 'Dia', position: 'insideBottomRight', offset: -5 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Vel (m/min)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Intensidade (%)', angle: -90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="velocidade" name="Velocidade" stroke="#10b981" dot={{ r: 3 }} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="intensidade" name="Intensidade" stroke="#6366f1" dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-slate-600 mt-2">O gráfico reage automaticamente aos treinos adicionados/alterados.</p>
        </div>
      )}

      {/* Observações */}
      <div className="space-y-2 mt-6 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-1">Observações</label>
        <textarea className="w-full border-slate-200 border rounded-xl p-3" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => {
            if (!calc) return
            const pdf = new jsPDF()
            pdf.setFontSize(18)
            pdf.text('Prescrição Semanal', 20, 20)
            pdf.setFontSize(12)
            pdf.text(`Aluno: ${students.find(s=>s.id===selectedStudentId)?.name ?? ''}`, 20, 32)
            pdf.text(`VO2máx: ${calc.summary.vo2Max} ml/kg/min — MET máx: ${calc.summary.maxMET}`, 20, 40)
            const body = calc.intervals.map((r,i)=>{
              const tMinRep = r.velocityMPerMin && r.velocityMPerMin > 0 ? r.distanceMeters / r.velocityMPerMin : 0
              const tSec = Math.round(tMinRep * 60)
              const mm = Math.floor(tSec / 60)
              const ss = String(tSec % 60).padStart(2, '0')
              const tempoRep = `${mm}:${ss}`
              return [
                i+1,
                r.dayOfWeek ?? '',
                r.distanceMeters,
                r.intensityPercentage ?? '',
                r.repetitions ?? 1,
                r.restSeconds ?? 0,
                r.timeMinutes,
                tempoRep,
                r.velocityMPerMin,
                r.velocityKmPerHour,
              ]
            })
            autoTable(pdf, {
              startY: 48,
              head: [['#','Dia','Distância (m)','Int (%)','Rep','Descanso (s)','Tempo total (min)','Tempo/rep (min:s)','Vel (m/min)','Pace (km/h)']],
              body,
              styles: { fontSize: 9, cellPadding: 2 },
              theme: 'striped'
            })
            const y = (pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 48
            pdf.text(`Totais: Distância ${calc.summary.totalDistanceMeters} m • Tempo ${calc.summary.totalTimeMinutes} min`, 20, y + 10)
            if (notes?.trim()) {
              pdf.text('Observações:', 20, y + 18)
              const obs = notes.trim()
              const lines = pdf.splitTextToSize(obs, 170)
              pdf.text(lines, 20, y + 26)
            }
            pdf.save('prescricao_semanal.pdf')
          }}
        >
          Salvar PDF
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => {
            logger.info('FORM', 'Click em Salvar teste: abrir modal de confirmação')
            setShowConfirm(true)
          }}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar teste'}
        </button>
        {saveMessage && (
          <span className="text-emerald-700 text-sm" aria-live="polite">{saveMessage}</span>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        title="Confirmar salvamento"
        message="Tem certeza que deseja salvar este teste intervalado?"
        confirmText="Salvar"
        cancelText="Cancelar"
        type="info"
        isLoading={saving}
      />

      {/* Removido form oculto: salvamento é feito via ação explícita com feedback */}
      <DebugLogger />
    </div>
  )
}