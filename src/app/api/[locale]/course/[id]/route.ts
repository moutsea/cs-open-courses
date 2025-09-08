import { NextResponse } from 'next/server';
import { getCourseById } from '@/lib/courseParser';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  let locale, id;
  try {
    const resolvedParams = await params;
    locale = resolvedParams.locale;
    id = resolvedParams.id;
    const course = await getCourseById(id, locale);
    
    if (!course) {
      return NextResponse.json(
        { error: locale === 'zh' ? '课程未找到' : 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: locale === 'zh' ? '获取课程失败' : 'Failed to fetch course' },
      { status: 500 }
    );
  }
}