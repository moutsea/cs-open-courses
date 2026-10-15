import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseMarkdownFile } from './courseParser';
import { getAllCourses } from './getServerData';
import { truncateText } from './textUtils';

test('truncation preserves complete emoji at the character limit', () => {
  assert.equal(truncateText('ab🌟cd', 3), 'ab🌟...');
  assert.equal(truncateText('🌟🌟🌟', 2), '🌟🌟...');
  assert.equal(truncateText('中文🌟课程', 3), '中文🌟...');
  assert.equal(truncateText('abcdef', 3), 'abc...');
  assert.equal(truncateText('ab🌟', 3), 'ab🌟');
  assert.equal(truncateText('', 3), '');
});

test('Markdown summaries preserve emoji at the 150-character boundary', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'course-summary-'));
  try {
    const filePath = path.join(directory, 'course.md');
    const prefix = 'a'.repeat(149);
    await writeFile(filePath, `# Course\n\n## Course Introduction\n\n${prefix}🌟tail\n`);
    const course = await parseMarkdownFile(filePath, 'en');
    assert.equal(course.summaryEn, `${prefix}🌟...`);
    assert.ok(course.summaryEn.isWellFormed());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('all course descriptions and summaries are well-formed Unicode', async () => {
  for (const locale of ['en', 'zh']) {
    const courses = await getAllCourses(locale);
    assert.ok(courses.length > 0);
    for (const slug of ['CS148', 'CS106L']) {
      assert.ok(courses.some(course => course.slug === slug), `Missing regression course: ${slug}`);
    }
    for (const course of courses) {
      for (const field of ['description', 'summary', 'summaryEn'] as const) {
        const value = course[field];
        if (value) assert.ok(value.isWellFormed(), `${course.path}: malformed ${field}`);
      }
    }
  }
});
