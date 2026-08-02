import { NextResponse } from 'next/server'
import { buildCourseCatalog } from '@/lib/searchIndex'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  return NextResponse.json(buildCourseCatalog(locale))
}
