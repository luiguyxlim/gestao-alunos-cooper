'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface Student {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'masculino' | 'feminino' | 'outro'
  weight?: number
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateStudentData {
  name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'masculino' | 'feminino' | 'outro'
  weight?: number
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_notes?: string
}

export interface UpdateStudentData extends CreateStudentData {
  active?: boolean
}

// Buscar todos os alunos do usuário
export async function getStudents(): Promise<Student[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('evaluatees')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Erro ao buscar alunos:', error)
    // Se a tabela não existe, retorna array vazio
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.evaluatees" does not exist')) {
      console.warn('Tabela evaluatees não encontrada. Execute o script supabase-setup.sql no SQL Editor do Supabase.')
      return []
    }
    throw new Error('Erro ao buscar avaliandos')
  }

  return data || []
}

// Buscar um aluno específico
export async function getStudent(id: string): Promise<Student | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('evaluatees')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Erro ao buscar aluno:', error)
    return null
  }

  return data
}

// Criar novo aluno
export async function createStudent(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const studentData: CreateStudentData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    birth_date: formData.get('birth_date') as string || undefined,
    gender: formData.get('gender') as 'masculino' | 'feminino' | 'outro' || undefined,
    weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : undefined,
    address: formData.get('address') as string || undefined,
    emergency_contact: formData.get('emergency_contact') as string || undefined,
    emergency_phone: formData.get('emergency_phone') as string || undefined,
    medical_notes: formData.get('medical_notes') as string || undefined,
  }

  // Validação básica
  if (!studentData.name || studentData.name.trim().length === 0) {
    throw new Error('Nome é obrigatório')
  }

  const { error } = await supabase
    .from('evaluatees')
    .insert({
      ...studentData,
      user_id: user.id,
    })

  if (error) {
    console.error('Erro ao criar avaliando:', error)
     throw new Error('Erro ao criar avaliando')
  }

  revalidatePath('/evaluatees')
  redirect('/evaluatees')
}

// Atualizar aluno
export async function updateStudent(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const studentData: UpdateStudentData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    birth_date: formData.get('birth_date') as string || undefined,
    gender: formData.get('gender') as 'masculino' | 'feminino' | 'outro' || undefined,
    weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : undefined,
    address: formData.get('address') as string || undefined,
    emergency_contact: formData.get('emergency_contact') as string || undefined,
    emergency_phone: formData.get('emergency_phone') as string || undefined,
    medical_notes: formData.get('medical_notes') as string || undefined,
  }

  // Validação básica
  if (!studentData.name || studentData.name.trim().length === 0) {
    throw new Error('Nome é obrigatório')
  }

  const { error } = await supabase
    .from('evaluatees')
    .update(studentData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao atualizar avaliando:', error)
     throw new Error('Erro ao atualizar avaliando')
  }

  revalidatePath('/evaluatees')
  revalidatePath(`/evaluatees/${id}`)
  redirect('/evaluatees')
}

// Desativar aluno (soft delete)
export async function deactivateStudent(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('evaluatees')
    .update({ active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao desativar avaliando:', error)
     throw new Error('Erro ao desativar avaliando')
  }

  revalidatePath('/evaluatees')
}

// Reativar aluno
export async function reactivateStudent(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('evaluatees')
    .update({ active: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao reativar avaliando:', error)
     throw new Error('Erro ao reativar avaliando')
  }

  revalidatePath('/evaluatees')
}

// Deletar aluno permanentemente
export async function deleteStudent(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('evaluatees')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao deletar aluno:', error)
    throw new Error('Erro ao deletar aluno')
  }

  revalidatePath('/evaluatees')
}