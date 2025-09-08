import { NextRequest, NextResponse } from 'next/server';
import { buildCourseStructure } from '@/lib/courseParser';

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const locale = pathname.split('/')[1];
    
    const categories = await buildCourseStructure();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}