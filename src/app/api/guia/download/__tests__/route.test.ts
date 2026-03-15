import { GET } from '../route'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { promises as fsPromises } from 'fs'

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
  },
}))

describe('GET /api/guia/download', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Response as unknown as { json?: (body: unknown, init?: ResponseInit) => Response }).json = (
      body: unknown,
      init?: ResponseInit,
    ) => new Response(JSON.stringify(body), init)
  })

  it('retorna 401 quando usuário não está autenticado', async () => {
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })

    const response = await GET({ nextUrl: new URL('http://localhost/api/guia/download') } as never)
    expect(response.status).toBe(401)
  })

  it('retorna 404 quando arquivo não existe', async () => {
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    })

    const missingError = Object.assign(new Error('missing'), { code: 'ENOENT' })
    fsPromises.access.mockRejectedValue(missingError)

    const response = await GET({ nextUrl: new URL('http://localhost/api/guia/download') } as never)
    expect(response.status).toBe(404)
  })

  it('retorna 200 quando arquivo é válido', async () => {
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    })

    fsPromises.access.mockResolvedValue(undefined)
    fsPromises.readFile.mockResolvedValue(Buffer.from('%PDF- mock file'))

    const response = await GET({ nextUrl: new URL('http://localhost/api/guia/download?inline=1') } as never)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('inline;')
  })
})
