import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import GuiaDownloadButton from '../GuiaDownloadButton'

describe('GuiaDownloadButton', () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    global.fetch = jest.fn()
    URL.createObjectURL = jest.fn(() => 'blob:mock')
    URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    document.createElement = originalCreateElement
  })

  it('realiza download com sucesso', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['pdf-data'], { type: 'application/pdf' })),
    })

    const anchorMock = originalCreateElement('a') as HTMLAnchorElement
    const clickSpy = jest.spyOn(anchorMock, 'click').mockImplementation(() => {})
    const removeSpy = jest.spyOn(anchorMock, 'remove').mockImplementation(() => {})

    document.createElement = jest.fn((tagName: string) => {
      if (tagName === 'a') return anchorMock
      return originalCreateElement(tagName)
    })

    render(<GuiaDownloadButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF original' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/guia/download', { method: 'GET' })
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(removeSpy).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Download concluído com sucesso.')).toBeInTheDocument()
    })
  })

  it('exibe erro quando arquivo não é encontrado', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    })

    render(<GuiaDownloadButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF original' }))

    await waitFor(() => {
      expect(screen.getByText('Arquivo do guia não encontrado.')).toBeInTheDocument()
    })
  })
})
