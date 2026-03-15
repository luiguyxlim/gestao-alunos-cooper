import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function getGuiaPathCandidates() {
  const configuredPath = process.env.GUIA_PDF_PATH
  const defaultRootPath = path.join(process.cwd(), 'GUIA COLORIDO.pdf')
  const defaultPublicPath = path.join(process.cwd(), 'public', 'GUIA COLORIDO.pdf')
  return [configuredPath, defaultRootPath, defaultPublicPath].filter((value): value is string => Boolean(value))
}

async function resolveGuiaPath() {
  const candidates = getGuiaPathCandidates()
  let lastError: unknown = null

  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const guiaPath = await resolveGuiaPath()
    const fileBuffer = await fs.readFile(guiaPath)
    const hasPdfHeader = fileBuffer.subarray(0, 5).toString('utf8') === '%PDF-'

    if (!hasPdfHeader) {
      return NextResponse.json({ message: 'Arquivo do guia está corrompido.' }, { status: 422 })
    }

    const fileName = path.basename(guiaPath)
    const inline = request.nextUrl.searchParams.get('inline') === '1'
    const dispositionType = inline ? 'inline' : 'attachment'

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${dispositionType}; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (fileError) {
    const code = (fileError as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return NextResponse.json({ message: 'Arquivo do guia não encontrado.' }, { status: 404 })
    }
    if (code === 'EACCES') {
      return NextResponse.json({ message: 'Sem permissão para acessar o arquivo.' }, { status: 403 })
    }
    return NextResponse.json({ message: 'Falha ao processar arquivo do guia.' }, { status: 500 })
  }
}
