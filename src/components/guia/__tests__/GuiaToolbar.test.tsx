import { fireEvent, render, screen } from '@testing-library/react'
import GuiaToolbar from '../GuiaToolbar'

describe('GuiaToolbar', () => {
  it('renderiza controles de zoom e busca', () => {
    render(
      <GuiaToolbar
        searchQuery=""
        onSearchQueryChange={jest.fn()}
        onSearchSubmit={jest.fn()}
        onPreviousMatch={jest.fn()}
        onNextMatch={jest.fn()}
        currentMatchIndex={0}
        totalMatches={0}
        scale={1}
        onZoomOut={jest.fn()}
        onZoomIn={jest.fn()}
        onZoomReset={jest.fn()}
        searching={false}
        disabled={false}
      />,
    )

    expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resetar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
    expect(screen.getByText('Sem resultados de busca')).toBeInTheDocument()
  })

  it('dispara callback de busca ao submeter formulário', () => {
    const handleSubmit = jest.fn()
    render(
      <GuiaToolbar
        searchQuery="teste"
        onSearchQueryChange={jest.fn()}
        onSearchSubmit={handleSubmit}
        onPreviousMatch={jest.fn()}
        onNextMatch={jest.fn()}
        currentMatchIndex={0}
        totalMatches={2}
        scale={1}
        onZoomOut={jest.fn()}
        onZoomIn={jest.fn()}
        onZoomReset={jest.fn()}
        searching={false}
        disabled={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })
})
