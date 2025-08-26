import { createServerSupabaseClient } from '../../supabase-server'
import { getStudents, getStudent, createStudent, updateStudent } from '../students'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('../../supabase-server')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

type MockQuery = {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  eq: jest.Mock
  order: jest.Mock
  single: jest.Mock
}

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  })),
}

const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<typeof createServerSupabaseClient>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>

describe('Students Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>)
    mockRevalidatePath.mockImplementation(() => {})
    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT')
    })
  })

  describe('getStudents', () => {
    it('should return students when user is authenticated', async () => {
      const mockStudents = [
        {
          id: '1',
          full_name: 'João Silva',
          email: 'joao@example.com',
          is_active: true,
        },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockStudents,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      const result = await getStudents()

      expect(result).toEqual(mockStudents)
      expect(mockSupabase.from).toHaveBeenCalledWith('evaluatees')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockQuery.order).toHaveBeenCalledWith('name')
    })

    it('should redirect to login when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Mock redirect to throw to stop execution
      mockRedirect.mockImplementation(() => {
        throw new Error('Redirect called')
      })

      await expect(getStudents()).rejects.toThrow('Redirect called')

      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })

    it('should return empty array when table does not exist', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Could not find the table' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      const result = await getStudents()

      expect(result).toEqual([])
    })

    it('should throw error for other database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      await expect(getStudents()).rejects.toThrow('Erro ao buscar avaliandos')
    })
  })

  describe('getStudent', () => {
    it('should return student when found', async () => {
      const mockStudent = {
        id: '1',
        full_name: 'João Silva',
        email: 'joao@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStudent,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      const result = await getStudent('1')

      expect(result).toEqual(mockStudent)
      expect(mockSupabase.from).toHaveBeenCalledWith('evaluatees')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('should return null when student not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      const result = await getStudent('1')

      expect(result).toBeNull()
    })
  })

  describe('createStudent', () => {
    it('should create student successfully', async () => {
      const formData = new FormData()
      formData.append('name', 'João Silva')
      formData.append('email', 'joao@example.com')
      formData.append('phone', '11999999999')
      formData.append('birth_date', '1995-05-15')
      formData.append('gender', 'masculino')

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: '1' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      try {
        await createStudent(formData)
      } catch (error) {
        expect((error as Error).message).toBe('REDIRECT')
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('evaluatees')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        birth_date: '1995-05-15',
        gender: 'masculino',
        address: undefined,
        emergency_contact: undefined,
        emergency_phone: undefined,
        medical_notes: undefined,
      })
      expect(mockRedirect).toHaveBeenCalledWith('/evaluatees')
    })

    it('should handle validation errors', async () => {
      const formData = new FormData()
      // Missing required fields (no name)

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      await expect(createStudent(formData)).rejects.toThrow('Nome é obrigatório')

      // Should not call insert with invalid data
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('updateStudent', () => {
    it('should update student successfully', async () => {
      const formData = new FormData()
      formData.append('name', 'João Silva Updated')
      formData.append('email', 'joao.updated@example.com')
      formData.append('phone', '11999999999')
      formData.append('birth_date', '1995-05-15')
      formData.append('gender', 'masculino')

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: '1' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as MockQuery)

      try {
        await updateStudent('1', formData)
      } catch (error) {
        expect((error as Error).message).toBe('REDIRECT')
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('evaluatees')
      expect(mockQuery.update).toHaveBeenCalledWith({
        name: 'João Silva Updated',
        email: 'joao.updated@example.com',
        phone: '11999999999',
        birth_date: '1995-05-15',
        gender: 'masculino',
        address: undefined,
        emergency_contact: undefined,
        emergency_phone: undefined,
        medical_notes: undefined,
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockRedirect).toHaveBeenCalledWith('/evaluatees')
    })
  })
})