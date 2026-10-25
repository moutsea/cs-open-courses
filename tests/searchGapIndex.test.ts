import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { buildContentIndex } from '../src/lib/searchGapIndex'
import { analyzeSearchGaps, matchTerm, type ContentIndex } from '../src/lib/searchGaps'
import { courseGuides } from '../src/data/course-guides'
import videos from '../src/data/course-videos.json'

const indexes = new Map<string, ContentIndex>()
before(async () => {
  for (const locale of ['zh', 'en']) indexes.set(locale, await buildContentIndex(locale))
})

function courseEntry(locale: string, key: string) {
  const path = `${locale === 'zh' ? '/zh' : ''}/course/${key}`
  const entry = indexes.get(locale)!.entries.find(entry => entry.path === path)
  assert.ok(entry, path)
  return entry
}

test('真实课程目录识别所有已有学习指南和学习路线', () => {
  for (const locale of ['zh', 'en']) {
    for (const key of Object.keys(courseGuides)) {
      const entry = courseEntry(locale, key)
      assert.ok(entry.capabilities.includes('guide'), `${locale}/${key}`)
      assert.ok(entry.capabilities.includes('roadmap'), `${locale}/${key}`)
    }
  }
  assert.equal(analyzeSearchGaps([{ term: 'CS61B 学习路线', count: 3 }], indexes.get('zh')!).rows[0].status, 'covered')
})

test('真实课程目录包含课程页人工整理的公开视频', () => {
  for (const locale of ['zh', 'en']) {
    for (const [key, resources] of Object.entries(videos.courses)) {
      if (resources.length) assert.ok(courseEntry(locale, key).capabilities.includes('video'), `${locale}/${key}`)
    }
  }
  for (const term of ['CS70 视频', 'CMU10-708 视频', 'CS122 视频', 'COS126 视频']) {
    assert.equal(analyzeSearchGaps([{ term, count: 3 }], indexes.get('zh')!).rows[0].status, 'covered', term)
  }
})

test('明确标记无视频或无教材的课程不再被视为已覆盖', () => {
  for (const locale of ['zh', 'en']) {
    for (const key of ['computer-graphics/CS148', 'programming-languages-design/CS242', 'programming-introduction/functional/Haskell-MOOC', 'programming-introduction/rust/cs220']) {
      assert.equal(courseEntry(locale, key).capabilities.includes('video'), false, `${locale}/${key}`)
    }
    for (const key of ['computer-networks/CS144', 'machine-learning/CS229', 'programming-languages-design/PKU-SoftwareAnalysis']) {
      assert.equal(courseEntry(locale, key).capabilities.includes('textbook'), false, `${locale}/${key}`)
    }
    assert.ok(courseEntry(locale, 'programming-languages-design/CS242').capabilities.includes('textbook'))
    assert.ok(courseEntry(locale, 'programming-languages-design/CS242').capabilities.includes('assignment'))
  }
  for (const term of ['CS148 视频', 'CS242 视频', 'CS144 教材']) {
    assert.equal(analyzeSearchGaps([{ term, count: 3 }], indexes.get('zh')!).rows[0].status, 'page_gap', term)
  }
})

test('真实索引优先完整课程编号，不让学校名称吞掉缺课需求', () => {
  for (const locale of ['zh', 'en']) {
    const index = indexes.get(locale)!
    for (const term of ['MIT 6.828 中文', 'MIT6.828 中文', 'Stanford CS107 教材']) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.status, 'missing_course', term)
      assert.equal(row.matched, null, term)
    }
    for (const code of ['6.824', 'MIT6.824', 'MIT 6.824']) {
      assert.equal(matchTerm(`${code} 视频`, index)?.entry.path, courseEntry(locale, 'parallel-distributed-systems/MIT6.824').path)
    }
    for (const code of ['10-414', 'CMU10-414', 'CMU 10-414']) {
      assert.equal(matchTerm(`${code} 视频`, index)?.entry.path, courseEntry(locale, 'machine-learning-systems/CMU10-414').path)
    }
    assert.ok(index.courseCodes.has('cs61b'))
    assert.ok(index.courseCodes.has('6824'))
    assert.ok(index.courseCodes.has('10414'))
  }
})

test('真实索引识别含数字的完整课程简称与纯数字路径编号', () => {
  for (const locale of ['zh', 'en']) {
    const index = indexes.get(locale)!
    for (const [term, key] of [
      ['N2T 教材', 'computer-architecture/N2T'],
      ['n2t教材', 'computer-architecture/N2T'],
      ['Nand2Tetris 视频', 'computer-architecture/N2T'],
      ['nand2tetris视频', 'computer-architecture/N2T'],
      ['6031 视频', 'software-engineering/6031'],
      ['6.031 视频', 'software-engineering/6031']
    ]) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, key).path, `${locale}: ${term}`)
      assert.equal(row.status, 'covered', `${locale}: ${term}`)
    }
  }
})

test('课程简称只认完整标识，混合查询中的未知课程仍报告缺课', () => {
  for (const locale of ['zh', 'en']) {
    const index = indexes.get(locale)!
    const n2t = courseEntry(locale, 'computer-architecture/N2T').path
    const construction = courseEntry(locale, 'software-engineering/6031').path
    for (const term of ['prefixN2Tsuffix 视频', 'N2T2 视频', 'N2T-2 视频', 'Nand2TetrisExtra 视频', 'Nand2Tetris-extra 视频', 'foo.6031 视频', '16031 视频', '60310 视频']) {
      const matched = matchTerm(term, index)
      assert.notEqual(matched?.entry.path, n2t, term)
      assert.notEqual(matched?.entry.path, construction, term)
    }
    for (const term of ['N2T CS999 教材', '6031 CS999 视频', 'Nand2Tetris MIT6.828 视频']) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.status, 'missing_course', term)
      assert.equal(row.matched, null, term)
    }
  }
})

test('课程与软件版本混合查询仍匹配真实课程并保留真正的缺课需求', () => {
  for (const locale of ['zh', 'en']) {
    const index = indexes.get(locale)!
    for (const [term, key] of [
      ['CS61B Java17', 'data-structures-algorithms/CS61B'],
      ['CS61B Java 17 视频', 'data-structures-algorithms/CS61B'],
      ['CS61A Python3.10 视频', 'programming-introduction/python/CS61A'],
      ['CS61A Python 3.10 视频', 'programming-introduction/python/CS61A'],
      ['6031 JDK17 视频', 'software-engineering/6031']
    ]) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, key).path, `${locale}: ${term}`)
      assert.equal(row.status, 'covered', `${locale}: ${term}`)
    }
    for (const term of ['CS61B Java17 CS999', 'Stanford CS107 Python3.10', 'MIT6.828 Java17']) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.status, 'missing_course', term)
      assert.equal(row.matched, null, term)
      assert.ok(['CS999', 'CS107', 'MIT6.828'].includes(row.missingCourse!), term)
    }
  }
})

for (const locale of ['zh', 'en']) {
  test(`${locale}: 资源序号后的独立数字课程号保持真实课程匹配`, () => {
    const index = indexes.get(locale)!
    for (const [resource, key, missing] of [
      ['video-10_6031.mp4', 'software-engineering/6031', []],
      ['lab-03_6031.pdf', 'software-engineering/6031', ['assignment', 'download']],
      ['lab_03_6031.pdf', 'software-engineering/6031', ['assignment', 'download']],
      ['video-10_6.S081.mp4', 'operating-systems/MIT6.S081', []],
      ['video-10_15-445.mp4', 'database-systems/15445', []]
    ] as const) {
      const report = analyzeSearchGaps([{ term: resource, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, key).path, resource)
      assert.equal(report.rows[0].status, missing.length ? 'page_gap' : 'covered', resource)
      assert.deepEqual(report.rows[0].missing, missing, resource)
      assert.deepEqual(report.missingCourses, [], resource)
      const unknown = analyzeSearchGaps([{ term: `${resource} CS999`, count: 3 }], index)
      assert.equal(unknown.rows[0].status, 'missing_course', resource)
      assert.equal(unknown.rows[0].missingCourse, 'CS999', resource)
    }
  })

  test(`${locale}: 资源序号的等价写法合并计数，数字续段仍不截短`, () => {
    const index = indexes.get(locale)!
    const queries = ['video10_6031.mp4', 'video-10_6031.mp4', 'video_10_6031.mp4']
      .map((term, i) => ({ term, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].count, 6)
      assert.equal(report.rows[0].status, 'covered')
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'software-engineering/6031').path)
      assert.equal(report.summary.covered, 1)
      assert.equal(report.summary.searches, 6)
    }
    for (const resource of ['video-6031_2.mp4', 'video-10_6031_2.mp4', 'video10_6031_2.mp4']) {
      const row = analyzeSearchGaps([{ term: resource, count: 3 }], index).rows[0]
      assert.equal(row.matched, null, resource)
      assert.equal(row.status, 'missing_page', resource)
      const mixed = analyzeSearchGaps([{ term: `CS61B ${resource}`, count: 3 }], index).rows[0]
      assert.equal(mixed.matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, resource)
      assert.equal(mixed.status, 'covered', resource)
    }
  })

  test(`${locale}: 补零资源序号保留真实数字课程与混合查询需求`, () => {
    const index = indexes.get(locale)!
    for (const [resource, key, missing] of [
      ['video-0010_6031.mp4', 'software-engineering/6031', []],
      ['lab_0003_6031.pdf', 'software-engineering/6031', ['assignment', 'download']],
      ['video-0010_6.S081.mp4', 'operating-systems/MIT6.S081', []],
      ['video_0003a_15-445.mp4', 'database-systems/15445', []]
    ] as const) {
      const report = analyzeSearchGaps([{ term: resource, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, key).path, resource)
      assert.equal(report.rows[0].status, missing.length ? 'page_gap' : 'covered', resource)
      assert.deepEqual(report.rows[0].missing, missing, resource)
      assert.deepEqual(report.missingCourses, [], resource)
      const unknown = analyzeSearchGaps([{ term: `${resource} CS999`, count: 3 }], index).rows[0]
      assert.equal(unknown.status, 'missing_course', resource)
      assert.equal(unknown.missingCourse, 'CS999', resource)
      const mixed = analyzeSearchGaps([{ term: `CS61B ${resource}`, count: 3 }], index).rows[0]
      assert.equal(mixed.matched, null, resource)
      assert.equal(mixed.status, 'missing_page', resource)
    }
  })

  test(`${locale}: 补零序号等价写法合并计数，数字续段仍不截短`, () => {
    const index = indexes.get(locale)!
    const queries = ['video0010_6031.mp4', 'video-0010_6031.mp4', 'video_0010_6031.mp4']
      .map((term, i) => ({ term, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].count, 6)
      assert.equal(report.rows[0].status, 'covered')
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'software-engineering/6031').path)
      assert.equal(report.summary.covered, 1)
      assert.equal(report.summary.searches, 6)
    }
    for (const resource of ['video-0010_6031_2.mp4', 'video0010_6031_2.mp4', 'video-006031_6031.mp4']) {
      const row = analyzeSearchGaps([{ term: resource, count: 3 }], index).rows[0]
      assert.equal(row.matched, null, resource)
      assert.equal(row.status, 'missing_page', resource)
      const mixed = analyzeSearchGaps([{ term: `CS61B ${resource}`, count: 3 }], index).rows[0]
      assert.equal(mixed.matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, resource)
      assert.equal(mixed.status, 'covered', resource)
    }
  })

  test(`${locale}: 资源版本的分隔符不改变课程匹配或缺口统计`, () => {
    const index = indexes.get(locale)!
    for (const suffix of ['v_6.031', 'version_6.0.31', 'v-6.031', 'version.6.0.31']) {
      const term = `CS61B lab03-${suffix}`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
      assert.equal(report.rows[0].status, 'covered', term)
      assert.equal(report.summary.covered, 1, term)
      assert.equal(report.summary.searches, 3, term)
      assert.deepEqual(report.missingCourses, [], term)
      const missing = analyzeSearchGaps([{ term: `${term}_CS_999`, count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course', term)
      assert.equal(missing.missingCourse, 'CS_999', term)
    }
    const queries = ['CS61B lab03-v_6.031', 'CS61B lab03-v-6.031', 'CS61B lab03-v.6.031']
      .map((term, i) => ({ term, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.summary.covered, 1)
      assert.equal(report.summary.searches, 6)
    }
  })

  test(`${locale}: 更长数字编号不会误报为已有课程覆盖`, () => {
    const index = indexes.get(locale)!
    for (const number of ['6031.2', '6031-2', '6031.6031', '6031-6031']) {
      const term = `video-${number}.mp4`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched, null, term)
      assert.equal(report.rows[0].status, 'missing_page', term)
      assert.equal(report.summary.covered, 0, term)
      assert.deepEqual(report.missingCourses, [], term)
      const mixed = analyzeSearchGaps([{ term: `CS61B ${term}`, count: 3 }], index).rows[0]
      assert.equal(mixed.status, 'covered', term)
      assert.equal(mixed.matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
    }
  })

  test(`${locale}: 下划线数字续段不误匹配短编号或制造缺课记录`, () => {
    const index = indexes.get(locale)!
    for (const number of ['6031_2', '6031__2', '6031_6031', '6031_2.3', '6031_2_3']) {
      const term = `video-${number}.mp4`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched, null, term)
      assert.equal(report.rows[0].status, 'missing_page', term)
      assert.equal(report.summary.covered, 0, term)
      assert.equal(report.summary.missingPage, 1, term)
      assert.deepEqual(report.missingCourses, [], term)
    }
  })

  test(`${locale}: 下划线数字续段保留相邻课程及合并统计`, () => {
    const index = indexes.get(locale)!
    for (const number of ['6031_2', '6031__2', '6031_6031', '6031_2.3', '6031_2_3']) {
      const term = `CS61B video-${number}.mp4`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].status, 'covered', term)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
      assert.equal(report.summary.covered, 1, term)
      assert.deepEqual(report.missingCourses, [], term)
      const missing = analyzeSearchGaps([{ term: `video-${number}_CS_999.mp4`, count: 3 }], index)
      assert.equal(missing.rows[0].status, 'missing_course', term)
      assert.deepEqual(missing.missingCourses.map(gap => [gap.code, gap.searches]), [['CS_999', 3]], term)
    }
    const queries = ['CS61B video-6031_2.mp4', 'CS61B video-6031.2.mp4', 'CS61B video-6031-2.mp4']
      .map((term, i) => ({ term, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].count, 6)
      assert.equal(report.summary.covered, 1)
      assert.equal(report.summary.searches, 6)
      assert.deepEqual(report.missingCourses, [])
    }
  })

  test(`${locale}: 后缀内下划线连接的课程号保留匹配与缺课计数`, () => {
    const index = indexes.get(locale)!
    for (const [code, key] of [
      ['CS_61B', 'data-structures-algorithms/CS61B'],
      ['MIT_6.S081', 'operating-systems/MIT6.S081'],
      ['CMU_10-414', 'machine-learning-systems/CMU10-414'],
      ['N_2T', 'computer-architecture/N2T']
    ]) {
      const term = `lab03-${code}.pdf`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, key).path, term)
      assert.ok(report.rows[0].missing.includes('download'), term)
      assert.deepEqual(report.missingCourses, [], term)
    }
    for (const code of ['CS_999', 'MIT_6.S999', 'CMU_99-999']) {
      const term = `CS61B lab03-${code}`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].status, 'missing_course', term)
      assert.equal(report.rows[0].missingCourse, code, term)
      assert.equal(report.rows[0].matched, null, term)
    }
    const queries = ['CS61B lab03-CS_999', 'CS61B lab03-CS-999', 'CS61B lab03-CS.999']
      .map((term, i) => ({ term, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].status, 'missing_course')
      assert.equal(report.summary.covered, 0)
      assert.deepEqual(report.missingCourses.map(gap => [gap.code.replace(/[_.-]/g, ''), gap.searches]), [['CS999', 6]])
    }
  })

  test(`${locale}: 资源文件名后缀中的课程号优先于资源过滤和学校回退`, () => {
    const index = indexes.get(locale)!
    for (const [term, key, missing] of [
      ['lab03-CS61B.pdf', 'data-structures-algorithms/CS61B', ['download']],
      ['lab03_CS61B', 'data-structures-algorithms/CS61B', []],
      ['lab03-CS-61B.pdf', 'data-structures-algorithms/CS61B', ['download']],
      ['lab03-MIT6.S081.pdf', 'operating-systems/MIT6.S081', ['download']],
      ['lab03-part01-MIT6.S081-part02.pdf', 'operating-systems/MIT6.S081', ['download']],
      ['video10-part01-6031-part02.mp4', 'software-engineering/6031', []],
      ['video10-N2T-part02.mp4', 'computer-architecture/N2T', []]
    ] as const) {
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      const row = report.rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, key).path, term)
      assert.equal(row.status, missing.length ? 'page_gap' : 'covered', term)
      assert.deepEqual(row.missing, missing, term)
      assert.deepEqual(report.missingCourses, [], term)
    }
  })

  test(`${locale}: 后缀中的未知课程不能被误报为已覆盖或在合并中丢失`, () => {
    const index = indexes.get(locale)!
    for (const [term, code] of [
      ['CS61B lab03-CS999', 'CS999'], ['CS61B lab03_CS999.pdf', 'CS999'],
      ['lab03-part01-CS999-part02.pdf', 'CS999'], ['lab03-CS61B-part01-CS999.pdf', 'CS999'],
      ['lab03-MIT6.S999.pdf', 'MIT6.S999'], ['lab-6.S081-part01-CS999.pdf', 'CS999']
    ]) {
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].status, 'missing_course', term)
      assert.equal(report.rows[0].missingCourse, code, term)
      assert.equal(report.rows[0].matched, null, term)
      assert.deepEqual(report.missingCourses.map(gap => gap.code), [code], term)
    }
    const queries = ['CS61B lab03-CS999', 'CS61B lab03_CS999', 'CS61B lab03.CS999']
      .map((term, i) => ({ term, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].status, 'missing_course')
      assert.deepEqual(report.missingCourses.map(gap => [gap.code, gap.searches]), [['CS999', 6]])
      assert.equal(report.summary.covered, 0)
    }
  })

  test(`${locale}: 带数字说明后缀的资源保留真实能力缺口和合并计数`, () => {
    const index = indexes.get(locale)!
    for (const [resource, missing] of [
      ['lab03-part01.pdf', ['download']],
      ['video10-part02.mp4', []],
      ['exam01-part01.pdf', ['exam', 'download']],
      ['cheat-sheet01-part02.pdf', ['notes', 'download']],
      ['lab03-part01-solution.pdf', ['answers', 'download']]
    ] as const) {
      const term = `CS61B ${resource}`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
      assert.equal(report.rows[0].status, missing.length ? 'page_gap' : 'covered', term)
      assert.deepEqual(report.rows[0].missing, missing, term)
      assert.deepEqual(report.missingCourses, [], term)
      assert.deepEqual(report.topMissing.map(gap => gap.capability), missing, term)
    }
    const queries = ['lab03-part01.pdf', 'lab03_part01.pdf', 'lab03.part01.pdf']
      .map((resource, i) => ({ term: `CS61B ${resource}`, count: i + 1 }))
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].status, 'page_gap')
      assert.equal(report.rows[0].count, 6)
      assert.deepEqual(report.topMissing.map(gap => [gap.capability, gap.searches]), [['download', 6]])
      assert.deepEqual(report.missingCourses, [])
    }
  })

  test(`${locale}: 数字资源后缀不掩盖真正缺课且保留资源前缀后的课程号`, () => {
    const index = indexes.get(locale)!
    for (const resource of ['lab03-part01.pdf', 'video10-part02.mp4', 'lab03-handout-part01-v1.0.0.pdf']) {
      for (const term of [`CS61B ${resource} CS999`, `CS999 ${resource} CS61B`]) {
        const report = analyzeSearchGaps([{ term, count: 3 }], index)
        assert.equal(report.rows[0].status, 'missing_course', term)
        assert.equal(report.rows[0].missingCourse, 'CS999', term)
        assert.deepEqual(report.missingCourses.map(gap => gap.code), ['CS999'], term)
      }
    }
    for (const [term, path] of [
      ['lab-6.S081-part01.pdf', 'operating-systems/MIT6.S081'],
      ['video-15-445-part02.mp4', 'database-systems/15445'],
      ['video-6031-part02.mp4', 'software-engineering/6031']
    ]) {
      assert.equal(analyzeSearchGaps([{ term, count: 3 }], index).rows[0].matched?.path, courseEntry(locale, path).path, term)
    }
    for (const code of ['6.828', '6.S999']) {
      assert.equal(analyzeSearchGaps([{ term: `lab-${code}-part01.pdf`, count: 3 }], index).rows[0].missingCourse, code)
    }
  })

  test(`${locale}: 资源文件名与说明后缀保留课程匹配和真实资源缺口`, () => {
    const index = indexes.get(locale)!
    for (const [resource, missing] of [
      ['lab03.pdf', ['download']],
      ['lab03.java', []],
      ['lab03-handout', []],
      ['lab03-solution', ['answers']],
      ['video10.mp4', []],
      ['exam01.pdf', ['exam', 'download']],
      ['cheat-sheet01.pdf', ['notes', 'download']]
    ] as const) {
      const term = `CS61B ${resource}`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      const row = report.rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
      assert.equal(row.status, missing.length ? 'page_gap' : 'covered', term)
      assert.deepEqual(row.missing, missing, term)
      assert.deepEqual(report.missingCourses, [], term)
      assert.deepEqual(report.topMissing.map(gap => gap.capability), missing, term)
    }
  })

  test(`${locale}: 带后缀的资源序号不掩盖相邻未知课程`, () => {
    const index = indexes.get(locale)!
    for (const resource of ['lab03.pdf', 'lab03-handout', 'video10.mp4', 'exam01.pdf']) {
      for (const term of [`CS61B ${resource} CS999`, `CS999 ${resource} CS61B`]) {
        const report = analyzeSearchGaps([{ term, count: 3 }], index)
        assert.equal(report.rows[0].status, 'missing_course', term)
        assert.equal(report.rows[0].missingCourse, 'CS999', term)
        assert.deepEqual(report.missingCourses.map(gap => gap.code), ['CS999'], term)
      }
    }
    for (const [term, path] of [
      ['lab-6.S081 lab03-handout', 'operating-systems/MIT6.S081'],
      ['lab-6.824 video10.mp4', 'parallel-distributed-systems/MIT6.824']
    ]) {
      assert.equal(analyzeSearchGaps([{ term, count: 3 }], index).rows[0].matched?.path, courseEntry(locale, path).path, term)
    }
    assert.equal(analyzeSearchGaps([{ term: 'lab-6.S999 lab03.pdf', count: 3 }], index).rows[0].missingCourse, '6.S999')
  })

  test(`${locale}: 资源前缀与完整课程编号之间的分隔符不改变课程匹配`, () => {
    const index = indexes.get(locale)!
    for (const [prefix, code, key] of [
      ['lab', '6.824', 'parallel-distributed-systems/MIT6.824'],
      ['video', '15-445', 'database-systems/15445'],
      ['lab', '6.S081', 'operating-systems/MIT6.S081'],
      ['video', '6031', 'software-engineering/6031']
    ]) {
      const queries = [' ', '-', '_'].map((separator, i) => ({ term: `${prefix}${separator}${code}`, count: i + 1 }))
      for (const query of queries) {
        const row = analyzeSearchGaps([query], index).rows[0]
        assert.equal(row.matched?.path, courseEntry(locale, key).path, query.term)
        assert.equal(row.status, 'covered', query.term)
      }
      for (const input of [queries, [...queries].reverse()]) {
        const report = analyzeSearchGaps(input, index)
        assert.equal(report.rows.length, 1)
        assert.equal(report.rows[0].count, 6)
        assert.equal(report.rows[0].status, 'covered')
      }
    }
    const exam = analyzeSearchGaps([{ term: 'exam-18.06', count: 3 }], index).rows[0]
    assert.equal(exam.matched?.path, courseEntry(locale, 'mathematics-basics/MITLA').path)
    assert.equal(exam.status, 'page_gap')
    assert.deepEqual(exam.missing, ['exam'])
  })

  test(`${locale}: 资源前缀不吞掉未知课程号，相邻实验序号仍被过滤`, () => {
    const index = indexes.get(locale)!
    for (const code of ['6.828', '6.S999', '15-999']) {
      for (const separator of [' ', '-', '_']) {
        const term = `lab${separator}${code}`
        const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
        assert.equal(row.status, 'missing_course', term)
        assert.equal(row.missingCourse, code, term)
      }
    }
    for (const term of ['lab-6.824 lab03', 'lab_6.S081 lab-03']) {
      assert.equal(analyzeSearchGaps([{ term, count: 3 }], index).rows[0].status, 'covered', term)
      const missing = analyzeSearchGaps([{ term: `${term} CS999`, count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course', term)
      assert.equal(missing.missingCourse, 'CS999', term)
    }
  })

  test(`${locale}: 复合词别名保留真实缺口并合并等价查询`, () => {
    const index = indexes.get(locale)!
    for (const [terms, capability] of [
      [['cheatsheet', 'cheat sheet', 'cheat-sheet'], 'notes'],
      [['ebook', 'e book', 'e-book'], 'download']
    ] as const) {
      const input = terms.map((term, i) => ({ term: `CS61B ${term}`, count: i + 1 }))
      for (const query of input) {
        const row = analyzeSearchGaps([query], index).rows[0]
        assert.equal(row.matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, query.term)
        assert.equal(row.status, 'page_gap', query.term)
        assert.deepEqual(row.missing, [capability], query.term)
      }
      for (const queries of [input, [...input].reverse()]) {
        const report = analyzeSearchGaps(queries, index)
        assert.equal(report.rows.length, 1)
        assert.equal(report.rows[0].status, 'page_gap')
        assert.equal(report.rows[0].count, 6)
        assert.deepEqual(report.rows[0].missing, [capability])
        assert.equal(report.topMissing[0].searches, 6)
      }
    }
  })

  test(`${locale}: 两位资源序号正确判定资源能力，不生成假缺课记录`, () => {
    const index = indexes.get(locale)!
    for (const resource of ['lab03', 'lab10', 'lab03a', 'video10', 'project10']) {
      const term = `CS61B ${resource}`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
      assert.equal(report.rows[0].status, 'covered', term)
      assert.deepEqual(report.missingCourses, [], term)
      const missing = analyzeSearchGaps([{ term: `${term} CS999`, count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course', term)
      assert.equal(missing.missingCourse, 'CS999', term)
    }
    for (const [term, capability] of [['CS61B exam01', 'exam'], ['CS61B note01', 'notes'], ['CS61B lab03 答案', 'answers'], ['CS229 lab03', 'assignment']]) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.status, 'page_gap', term)
      assert.deepEqual(row.missing, [capability], term)
    }
    const input = [{ term: 'CS61B lab03', count: 2 }, { term: 'CS61B lab 03', count: 3 }]
    for (const queries of [input, [...input].reverse()]) {
      const report = analyzeSearchGaps(queries, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].count, 5)
      assert.equal(report.rows[0].status, 'covered')
    }
    assert.equal(analyzeSearchGaps([{ term: 'lab 6.828', count: 3 }], index).rows[0].missingCourse, '6.828')
  })

  test(`${locale}: 软件名不产生虚假的实验缺口，真正的 lab 查询仍判定能力`, () => {
    const index = indexes.get(locale)!
    for (const software of ['MATLAB2024', 'MATLAB R2024b', 'Colab', 'GitLab']) {
      const report = analyzeSearchGaps([{ term: `CS229 ${software} 视频`, count: 3 }], index)
      const row = report.rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, 'machine-learning/CS229').path, software)
      assert.equal(row.status, 'covered', software)
      assert.deepEqual(row.intents, ['video'], software)
      assert.deepEqual(row.missing, [], software)
      assert.deepEqual(report.topMissing, [], software)
    }
    const lab = analyzeSearchGaps([{ term: 'CS229 Colab lab3 视频', count: 3 }], index).rows[0]
    assert.equal(lab.status, 'page_gap')
    assert.deepEqual(lab.missing, ['assignment'])
    assert.equal(analyzeSearchGaps([{ term: 'CS61B GitLab lab3 视频', count: 3 }], index).rows[0].status, 'covered')
  })

  test(`${locale}: 版本约束正确匹配资源，真实缺课和计数保留`, () => {
    const index = indexes.get(locale)!
    for (const version of ['NumPy==1.26.4', 'NumPy >= 1.26.4', 'SciPy~=1.10.1', 'NumPy>=1.26.4,<2.0.0']) {
      const term = `CS229 ${version} 视频`
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'machine-learning/CS229').path, term)
      assert.equal(report.rows[0].status, 'covered', term)
      assert.deepEqual(report.missingCourses, [], term)
      const missing = analyzeSearchGaps([{ term: `${term} CS999`, count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course', term)
      assert.equal(missing.missingCourse, 'CS999', term)
    }
    const queries = [{ term: 'CS229 NumPy==1.26.4 视频', count: 2 }, { term: 'CS229 NumPy 1.26.4 视频', count: 3 }]
    for (const input of [queries, [...queries].reverse()]) {
      const report = analyzeSearchGaps(input, index)
      assert.equal(report.rows.length, 1)
      assert.equal(report.rows[0].status, 'covered')
      assert.equal(report.rows[0].count, 5)
    }
  })

  test(`${locale}: 软件库和运行时版本不遮蔽已有课程及其资源`, () => {
    const index = indexes.get(locale)!
    for (const [term, key] of [
      ['CS229 NumPy1.26 视频', 'machine-learning/CS229'],
      ['CS229 NumPy 1.26 video', 'machine-learning/CS229'],
      ['CS229 SciPy1.10 视频', 'machine-learning/CS229'],
      ['CS61B JRE17 教材', 'data-structures-algorithms/CS61B'],
      ['JRE 17 CS61B textbook', 'data-structures-algorithms/CS61B']
    ]) {
      const report = analyzeSearchGaps([{ term, count: 3 }], index)
      assert.equal(report.rows[0].matched?.path, courseEntry(locale, key).path, term)
      assert.equal(report.rows[0].status, 'covered', term)
      assert.deepEqual(report.missingCourses, [], term)
      const missing = analyzeSearchGaps([{ term: `${term} CS999`, count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course', term)
      assert.equal(missing.missingCourse, 'CS999', term)
    }
    assert.equal(matchTerm('CS229 MATLAB2024', index)?.entry.path, courseEntry(locale, 'machine-learning/CS229').path)
  })

  test(`${locale}: 多段版本与已有数字课程编号碰撞时仍匹配查询中的真正课程`, () => {
    const index = indexes.get(locale)!
    for (const version of ['Java 6.0.31', 'Java6.0.31', 'Java 6.03.1', 'Java 6-0-31', 'Java 6_03_1']) {
      for (const term of [`CS61B ${version} 教材`, `${version} CS61B textbook`]) {
        const report = analyzeSearchGaps([{ term, count: 3 }], index)
        assert.equal(report.rows[0].matched?.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path, term)
        assert.equal(report.rows[0].status, 'covered', term)
        assert.deepEqual(report.missingCourses, [], term)
      }
      assert.notEqual(matchTerm(`${version} 视频`, index)?.entry.path, courseEntry(locale, 'software-engineering/6031').path, version)
      const missing = analyzeSearchGaps([{ term: `CS61B ${version} CS999 教材`, count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course', version)
      assert.equal(missing.missingCourse, 'CS999', version)
    }
  })

  test(`${locale}: 语言名放在已有课程编号前后均保留正确页面`, () => {
    const index = indexes.get(locale)!
    for (const term of ['Java 6.031 视频', '6.031 Java 视频', 'Java 6031 视频', '6031 Java 视频', 'Java 6.031 JDK17 视频']) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, 'software-engineering/6031').path, term)
      assert.equal(row.status, 'covered', term)
    }
    const missing = analyzeSearchGaps([{ term: 'Java 6.031 CS999 视频', count: 3 }], index).rows[0]
    assert.equal(missing.status, 'missing_course')
    assert.equal(missing.missingCourse, 'CS999')
  })

  test(`${locale}: CS50x 完整标题与编号组合均使用入门课已有的学习路线`, () => {
    const original = indexes.get(locale)!
    for (const index of [original, { ...original, entries: [...original.entries].reverse() }]) {
      for (const term of ['CS50: This is CS50x 学习路线', 'CS50 CS50x 学习路线', 'CS50x CS50 学习路线', 'CS50: This is CS50x Java17 学习路线']) {
        const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
        assert.equal(row.matched?.path, courseEntry(locale, 'programming-introduction/c/CS50').path, term)
        assert.equal(row.status, 'covered', term)
      }
      for (const term of ['CS50 AI 视频', 'CS50 AI视频', 'CS50 Python 视频', courseEntry(locale, 'artificial-intelligence/CS50').label]) {
        assert.equal(matchTerm(term, index)?.entry.path, courseEntry(locale, 'artificial-intelligence/CS50').path, term)
      }
      const missing = analyzeSearchGaps([{ term: 'CS50: This is CS50x CS999 学习路线', count: 3 }], index).rows[0]
      assert.equal(missing.status, 'missing_course')
      assert.equal(missing.missingCourse, 'CS999')
    }
  })

  test(`${locale}: 目录编号的空格写法匹配课程，未知编号不会落到相近课程`, () => {
    const index = indexes.get(locale)!
    for (const [term, key] of [
      ['GAMES 101 视频', 'computer-graphics/GAMES101'],
      ['GAMES 103 视频', 'computer-graphics/GAMES103'],
      ['GAMES 202 视频', 'computer-graphics/GAMES202'],
      ['Data 100 视频', 'data-science/Data100'],
      ['AUT 1400', 'programming-introduction/cpp/AUT1400'],
      ['N 2T 视频', 'computer-architecture/N2T'],
      ['EECS 498-007 视频', 'deep-learning/EECS498-007']
    ]) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.matched?.path, courseEntry(locale, key).path, term)
      assert.equal(row.status, 'covered', term)
    }
    for (const term of ['EECS 16A 视频', 'EECS16A 视频', 'GAMES 999 视频', 'GAMES 1010 视频']) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.equal(row.status, 'missing_course', term)
      assert.equal(row.matched, null, term)
    }
    const merged = analyzeSearchGaps([{ term: 'GAMES101 视频', count: 1 }, { term: 'GAMES 101 视频', count: 2 }], index)
    assert.equal(merged.rows.length, 1)
    assert.equal(merged.rows[0].count, 3)
    assert.equal(merged.rows[0].status, 'covered')
  })

  test(`${locale}: 英文键只在词边界上匹配，长词不会顺带落到短键页面`, () => {
    const index = indexes.get(locale)!
    // 子串误命中：javascript ⊃ java、macos ⊃ cos、datascience ⊃ science。
    for (const term of ['javascript 教材', 'javascript', 'macos 配置', 'rustacean', 'pythonic']) {
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.notEqual(row.status, 'covered', term)
      assert.equal(row.matched, null, term)
    }
    // 正常写法不能被边界规则误伤：连写、版本号、中文连写、空格分词。
    for (const [term, key] of [
      ['java 教材', 'java'],
      ['java17 教程', 'java'],
      ['intro rust', 'rust'],
      ['用 rust 写', 'rust'],
      ['CS61B教材', 'cs61b'],
      ['6.824视频', '6824']
    ]) {
      const matched = matchTerm(term, index)
      assert.ok(matched, term)
      assert.equal(matched.key, key, term)
    }
    // 词边界判定不看归一化结果：空格在归一化里被删掉，但仍要认成词首。
    assert.equal(matchTerm('learn cs61b', index)?.entry.path, courseEntry(locale, 'data-structures-algorithms/CS61B').path)
  })

  test(`${locale}: 两个字母的学科简称能匹配到分类页，不会被最短长度挡掉`, () => {
    const index = indexes.get(locale)!
    // 缩写是别名表里人工维护的，之前被「英文键至少 3 个字符」的匹配下限整批挡掉。
    for (const [term, slug] of [
      ['os 教材', 'operating-systems'],
      ['ai 课程', 'artificial-intelligence'],
      ['db 作业', 'database-systems'],
      ['ml 视频', 'machine-learning'],
      ['cg 教材', 'computer-graphics'],
      ['pl 教材', 'programming-languages']
    ]) {
      const matched = matchTerm(term, index)
      assert.ok(matched, term)
      assert.equal(matched.entry.kind, 'category', term)
      assert.equal(matched.key, term.split(' ')[0], term)
      const row = analyzeSearchGaps([{ term, count: 3 }], index).rows[0]
      assert.notEqual(row.status, 'missing_page', term)
      assert.match(matched.entry.path, new RegExp(slug), term)
    }
    // 缩短下限不会把两字母虚词变成键：`macos` / `submit` 里切不出 `os` / `mit`。
    for (const term of ['macos 配置', 'submit homework', 'it 教程']) {
      assert.equal(matchTerm(term, index), undefined, term)
    }
  })
}
