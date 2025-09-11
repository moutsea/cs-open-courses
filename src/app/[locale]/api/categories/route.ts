import { NextResponse } from 'next/server';
import { buildCourseStructure } from '@/lib/courseParser';

export async function GET() {
  try {
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