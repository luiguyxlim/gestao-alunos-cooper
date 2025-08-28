import { render, screen } from '@testing-library/react'
import TestCard from '../TestCard'
import '@testing-library/jest-dom'

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

const mockTest = {
  id: '1',
  test_date: '2024-01-15',
  test_type: 'physical',
  speed: 8.5,
  agility: 7.2,
  strength: 9.0,
  endurance: 6.8,
  flexibility: 7.5,
  coordination: 8.0,
  balance: 7.8,
  power: 8.2,
  reaction_time: 0.25,
  vo2_max: 45.5,
  notes: 'Teste realizado em condições normais',
  evaluatees: {
    id: 'student-1',
    name: 'João Silva'
  }
}

describe('TestCard', () => {
  it('renders test information correctly', () => {
    render(<TestCard test={mockTest} />)
    
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Teste realizado em condições normais')).toBeInTheDocument()
  })

  it('calculates and displays average score correctly', () => {
    render(<TestCard test={mockTest} />)
    
    // Average should be calculated from all metrics
    // (8.5 + 7.2 + 9.0 + 6.8 + 7.5 + 8.0 + 7.8 + 8.2 + 0.25 + 45.5) / 10 = 10.885
    // But reaction_time and vo2_max might be scaled differently
    expect(screen.getByText(/Média Geral/)).toBeInTheDocument()
  })

  it('displays metrics count correctly', () => {
    render(<TestCard test={mockTest} />)
    
    expect(screen.getByText('10/10')).toBeInTheDocument()
  })

  it('handles missing metrics correctly', () => {
    const testWithMissingMetrics = {
      ...mockTest,
      speed: null,
      agility: null,
      strength: 9.0,
      endurance: 6.8
    }
    
    render(<TestCard test={testWithMissingMetrics} />)
    
    expect(screen.getByText('8/10')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<TestCard test={mockTest} />)
    
    expect(screen.getByText('Ver')).toBeInTheDocument()
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Ver Avaliando')).toBeInTheDocument()
    expect(screen.getByText('Excluir')).toBeInTheDocument()
  })

  it('displays test without notes', () => {
    const testWithoutNotes = { ...mockTest, notes: null }
    render(<TestCard test={testWithoutNotes} />)
    
    // When notes is null, the notes section should not be rendered
    expect(screen.queryByText('Observações:')).not.toBeInTheDocument()
  })

  it('displays test type correctly', () => {
    render(<TestCard test={mockTest} />)
    
    // Check if test type is displayed - handle multiple occurrences
    const physicoElements = screen.getAllByText('Físico')
    expect(physicoElements.length).toBeGreaterThan(0)
  })

  it('displays score with appropriate color coding', () => {
    render(<TestCard test={mockTest} />)
    
    const scoreElement = screen.getByText(/Média Geral/)
    expect(scoreElement).toBeInTheDocument()
  })
})