import { render, screen } from '@testing-library/react'
import StudentCard from '../StudentCard'
import { Student } from '@/lib/types'
import '@testing-library/jest-dom'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

const mockStudent: Student = {
  id: '1',
  user_id: 'user-1',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  birth_date: '1995-05-15',
  gender: 'masculino',
  address: 'Rua das Flores, 123',
  emergency_contact: 'Maria Silva',
  emergency_phone: '(11) 88888-8888',
  medical_notes: 'Nenhuma observação',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('StudentCard', () => {
  it('renders student information correctly', () => {
    render(<StudentCard student={mockStudent} />)
    
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@example.com')).toBeInTheDocument()
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument()
    expect(screen.getByText('14/05/1995')).toBeInTheDocument()
    expect(screen.getByText('Masculino')).toBeInTheDocument()
  })

  it('displays active status correctly', () => {
    render(<StudentCard student={mockStudent} />)
    
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toHaveClass('bg-emerald-100', 'text-emerald-700')
  })

  it('displays inactive status correctly', () => {
    const inactiveStudent = { ...mockStudent, active: false }
    render(<StudentCard student={inactiveStudent} />)
    
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('renders action buttons', () => {
    render(<StudentCard student={mockStudent} />)
    
    expect(screen.getByText('Ver')).toBeInTheDocument()
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Novo Teste')).toBeInTheDocument()
    expect(screen.getByText('Desativar')).toBeInTheDocument()
  })

  it('shows reactivate button for inactive students', () => {
    const inactiveStudent = { ...mockStudent, active: false }
    render(<StudentCard student={inactiveStudent} />)
    
    expect(screen.getByText('Reativar')).toBeInTheDocument()
  })

  it('formats gender correctly', () => {
    const femaleStudent = { ...mockStudent, gender: 'feminino' as const }
    render(<StudentCard student={femaleStudent} />)
    
    expect(screen.getByText('Feminino')).toBeInTheDocument()
  })

  it('handles other gender option', () => {
    const otherGenderStudent = { ...mockStudent, gender: 'outro' as const }
    render(<StudentCard student={otherGenderStudent} />)
    
    expect(screen.getByText('Outro')).toBeInTheDocument()
  })
})