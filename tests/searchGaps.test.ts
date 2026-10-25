import assert from 'node:assert/strict'
import test from 'node:test'
import {
  analyzeSearchGaps,
  detectIntents,
  extractCodes,
  matchTerm,
  normalizeTerm,
  type ContentEntry,
  type ContentIndex
} from '../src/lib/searchGaps'

function entry(partial: Partial<ContentEntry> & Pick<ContentEntry, 'kind' | 'path' | 'label'>): ContentEntry {
  return { keys: [], capabilities: [], ...partial }
}

const index: ContentIndex = {
  entries: [
    entry({
      kind: 'course',
      path: '/zh/course/data-structures-algorithms/CS61B',
      label: 'CS61B: Data Structures and Algorithms',
      keys: ['cs61b', 'datastructuresandalgorithms', 'cs61b'],
      capabilities: ['textbook', 'video', 'assignment', 'chinese']
    }),
    entry({
      kind: 'course',
      path: '/zh/course/operating-systems/MIT6.S081',
      label: 'MIT 6.S081: Operating System Engineering',
      keys: ['6s081', 'operatingsystemengineering', 'mit6s081'],
      capabilities: ['video', 'assignment', 'chinese']
    }),
    entry({
      kind: 'category',
      path: '/zh/courses/database-systems',
      label: '数据库系统',
      keys: ['数据库系统', 'database-systems', '数据库'],
      capabilities: ['guide', 'roadmap']
    }),
    entry({
      kind: 'university',
      path: '/zh/universities/stanford',
      label: '斯坦福大学',
      keys: ['斯坦福大学', 'stanford', '斯坦福'],
      capabilities: ['roadmap']
    }),
    entry({
      kind: 'hub',
      path: '/zh/tutorial',
      label: '学习路线',
      keys: ['学习路线', '路线图', 'roadmap'],
      capabilities: ['roadmap']
    }),
    entry({
      kind: 'course',
      path: '/zh/course/essential-tools/vpn',
      label: '翻墙',
      keys: ['翻墙', 'vpn'],
      capabilities: ['chinese']
    })
  ],
  courseCodes: new Set(['cs61b', '6s081'])
}

test('normalizeTerm 把课程码的三种写法归一', () => {
  assert.equal(normalizeTerm('CS 61B'), 'cs61b')
  assert.equal(normalizeTerm('cs-61b'), 'cs61b')
  assert.equal(normalizeTerm('  6.S081 实验 '), '6s081实验')
})

test('extractCodes 认得课程码，保留原写法，不把年份当课程码', () => {
  assert.deepEqual(extractCodes('6.824 笔记'), ['6.824'])
  assert.deepEqual(extractCodes('CMU 15-445 教材'), ['15-445'])
  assert.deepEqual(extractCodes('MIT 6.S081 lab'), ['6.S081'])
  assert.deepEqual(extractCodes('cs61b past exam'), ['cs61b'])
  assert.deepEqual(extractCodes('CMU 15213 是什么'), ['15213'])
  assert.deepEqual(extractCodes('STA 4273 Winter 2021'), [])
})

test('extractCodes 排除常见软件版本及其数字片段，保留相邻课程号', () => {
  for (const version of ['Java17', 'JAVA 17', 'Java-17', 'JDK17', 'OpenJDK 21', 'Python3.10', 'Python 3.10.2', 'Python v3.10', 'Node.js20.1', 'Node 20', 'C++17', 'C#12', 'Go1.22', 'Rust1.80', 'React18', 'CUDA12.1']) {
    assert.deepEqual(extractCodes(version), [], version)
    assert.deepEqual(extractCodes(`CS61B ${version} CS999`), ['CS61B', 'CS999'], version)
    const row = analyzeSearchGaps([{ term: version, count: 1 }], index).rows[0]
    assert.equal(row.status, 'missing_page', version)
    assert.equal(row.missingCourse, null, version)
  }
  assert.deepEqual(extractCodes('6.824 15-445 MIT6.S081'), ['6.824', '15-445', 'MIT6.S081'])
})

test('extractCodes 仅从已知完整标识补充短简称，不猜测年份或片段', () => {
  const known = new Set(['n2t', 'nand2tetris', '6031', 'cs61b'])
  assert.deepEqual(extractCodes('N2T Nand2Tetris 6031', known), ['N2T', 'Nand2Tetris', '6031'])
  assert.deepEqual(extractCodes('N2T Nand2Tetris 6031 2021'), [])
  assert.deepEqual(extractCodes('prefixN2Tsuffix N2T2 Nand2TetrisExtra 16031', known), ['16031'])
  assert.deepEqual(extractCodes('6.6031 CS61BB', known), ['6.6031', 'CS61BB'])
  assert.deepEqual(extractCodes('Python 3.6031', known), [])
  assert.deepEqual(extractCodes('N2T-2 Nand2Tetris-extra foo.6031', known), [])
  const namedIndex: ContentIndex = {
    entries: [entry({ kind: 'course', path: '/course/N2T', label: 'N2T', keys: ['n2t'] })],
    courseCodes: new Set(['n2t'])
  }
  assert.equal(matchTerm('N2T 教材', namedIndex)?.entry.path, '/course/N2T')
})

test('软件库与运行时版本不产生缺课记录，相邻未知课程仍保留', () => {
  for (const version of ['NumPy1.26', 'NumPy 1.26', 'NUMPY-1.26', 'NumPy v1.26', 'SciPy1.10', 'SciPy 1.10.1', 'JRE17', 'jre 17', 'JRE version 17', 'MATLAB2024']) {
    assert.deepEqual(extractCodes(version, index.courseCodes), [], version)
    assert.deepEqual(extractCodes(`${version} CS61B CS999`, index.courseCodes), ['CS61B', 'CS999'], version)
    const report = analyzeSearchGaps([{ term: `${version} 教材`, count: 3 }], index)
    assert.equal(report.rows[0].status, 'missing_page', version)
    assert.deepEqual(report.missingCourses, [], version)
  }
})

test('多段软件版本不能去掉分隔符后恢复成已知课程号', () => {
  const known = new Set(['6031', '6824', 'cs61b'])
  for (const version of ['6.0.31', '6.03.1', '6-0-31', '6_03_1', '6.8.24']) {
    for (const software of ['Java', 'Python', 'Node', 'Rust']) {
      for (const separator of ['', ' ', '-']) {
        const term = `${software}${separator}${version}`
        assert.deepEqual(extractCodes(term, known), [], term)
        assert.deepEqual(extractCodes(`CS61B ${term} CS999`, known), ['CS61B', 'CS999'], term)
      }
    }
  }
})

test('软件依赖的版本约束不作为课程号，明确约束优先于已知数字编号', () => {
  const known = new Set([...index.courseCodes, '6031'])
  for (const version of ['NumPy==1.26.4', 'numpy >= 1.26.4', 'SciPy~=1.10.1', 'JRE!=17', 'Node.js^20.1.0', 'Java<=6.031', 'Python===3.10.2', 'NumPy = v1.26.4']) {
    assert.deepEqual(extractCodes(version, known), [], version)
    assert.deepEqual(extractCodes(`CS61B ${version} CS999`, known), ['CS61B', 'CS999'], version)
  }
  assert.deepEqual(extractCodes('Java 6.031', known), ['6.031'])
})

test('完整版本范围均被排除，范围后的真实课程编号不被吞掉', () => {
  const known = new Set([...index.courseCodes, '6031'])
  for (const version of ['NumPy>=1.26.4,<2.0.0', 'SciPy >=1.10.1 <1.11.0', 'Java 6.031, !=6.032']) {
    assert.deepEqual(extractCodes(version, known), [], version)
    assert.deepEqual(new Set(extractCodes(`CS61B ${version}, 6.828 CS999`, known)), new Set(['CS61B', '6.828', 'CS999']), version)
  }
})

test('资源序号不生成课程编号，并保留相邻的真实课程与未知编号', () => {
  for (const resource of ['lab03', 'LAB10', 'lab03a', 'lab03.1', 'lab-03', 'lab_03', 'lab00003', 'video10', 'videos10', 'exam01', 'quiz10', 'quizzes10', 'note01', 'lecture10', 'project10', 'projects10', 'cheat-sheet01']) {
    assert.deepEqual(extractCodes(resource, index.courseCodes), [], resource)
    assert.deepEqual(extractCodes(`${resource} CS61B CS999`, index.courseCodes), ['CS61B', 'CS999'], resource)
  }
  assert.deepEqual(extractCodes('lab 6.828'), ['6.828'])
  assert.deepEqual(extractCodes('lab 6.031', new Set(['6031'])), ['6.031'])
  assert.deepEqual(extractCodes('quiz 15-445'), ['15-445'])
  assert.deepEqual(extractCodes('CLAB03 CS999'), ['CLAB03', 'CS999'])
})

test('目录中已有的完整课程标识不因与资源序号同名而丢失', () => {
  const named: ContentIndex = {
    entries: [entry({ kind: 'course', path: '/course/LAB03', label: 'LAB03', codes: ['lab03'], capabilities: ['video'] })],
    courseCodes: new Set(['lab03'])
  }
  assert.deepEqual(extractCodes('LAB03 lab10', named.courseCodes), ['LAB03'])
  const row = analyzeSearchGaps([{ term: 'LAB03 视频', count: 3 }], named).rows[0]
  assert.equal(row.matched?.path, '/course/LAB03')
  assert.equal(row.missingCourse, null)
})

test('资源前缀后的完整课程编号保留，含字母的编号不会被局部过滤', () => {
  const known = new Set(['6031', '6824', '6s081'])
  for (const [prefix, code] of [['lab', '6.824'], ['video', '15-445'], ['lab', '6.S081'], ['exam', '18.06'], ['lab', '6.828'], ['lab', '6.S999'], ['video', '15213'], ['video', '6031']]) {
    for (const separator of [' ', '-', '_']) {
      const term = `${prefix}${separator}${code}`
      assert.deepEqual(extractCodes(term, known), [code], term)
      assert.deepEqual(new Set(extractCodes(`${term} lab03 CS999`, known)), new Set([code, 'CS999']), term)
    }
  }
  assert.deepEqual(extractCodes('lab-6.S081'), ['6.S081'])
  assert.deepEqual(extractCodes('lab-6.828'), ['6.828'])
})

test('资源序号过滤仍支持后缀和句末标点', () => {
  for (const term of ['lab03.', 'lab-03.', 'lab_03', 'lab03a', 'lab03.1', 'video10', 'lab00003']) {
    assert.deepEqual(extractCodes(term, index.courseCodes), [], term)
  }
})

test('带文件扩展名或说明后缀的资源序号不生成假课程', () => {
  for (const resource of ['lab03.pdf', 'lab03.java', 'lab03-handout', 'lab03-solution', 'lab03-setup', 'lab03.tar.gz', 'video10.mp4', 'exam01.pdf', 'cheat-sheet01.pdf', 'lab-03.pdf', 'lab_03-handout']) {
    assert.deepEqual(extractCodes(resource, index.courseCodes), [], resource)
    for (const term of [`CS61B ${resource} CS999`, `CS999 ${resource} CS61B`]) {
      assert.deepEqual(new Set(extractCodes(term, index.courseCodes)), new Set(['CS61B', 'CS999']), term)
    }
  }
})

test('带数字的文件扩展名不被并入课程编号，也不吞掉编号', () => {
  const known = new Set([...index.courseCodes, '6031', '6824'])
  for (const extension of ['.m4a', '.m4v', '.h264', '.h265', '.x264', '.x265', '.7z', '.3gp', '.mp4v', '.264']) {
    for (const code of ['6.824', '6.S081', '15-445', '6.031']) {
      for (const prefix of ['', 'video-', 'lab-', 'notes_']) {
        const resource = `${prefix}${code}${extension}`
        assert.deepEqual(extractCodes(resource, known), [code], resource)
      }
    }
    // 四位纯数字目录编号只有整 token 命中才算课程，扩展名不能把它们一并吃掉。
    for (const code of ['6031', '6824']) {
      assert.deepEqual(extractCodes(`${code}${extension}`, known), [code], `${code}${extension}`)
      assert.deepEqual(extractCodes(`video-${code}${extension}`, known), [code], `video-${code}${extension}`)
    }
    // 扩展名之后的真实课程号仍然保留。
    const term = `video-6.824${extension} CS999`
    assert.deepEqual(new Set(extractCodes(term, known)), new Set(['6.824', 'CS999']), term)
  }
  // 裸 .264 与四位课程号同形，只有跟在复合编号后面时才算扩展名。
  assert.deepEqual(extractCodes('6.264', known), ['6.264'])
})

test('白名单外的扩展名也不吞课程编号，课程码自身的字母段不受影响', () => {
  const known = new Set([...index.courseCodes, '6031', '6824', '15213'])
  // 纯字母后缀可以通用判定：课程码末段一定带数字（6.S081、6.042J、18.06SC 都是），
  // 所以「点 + 纯字母」不可能是课程码本身。枚举后缀永远补不完，这条兜住漏网的。
  for (const extension of ['.aac', '.vob', '.zst', '.lua', '.rb', '.ini', '.cue', '.avif', '.tar.gz']) {
    for (const code of ['6.824', '6.S081', '15-445', '6.031']) {
      assert.deepEqual(extractCodes(`${code}${extension}`, known), [code], `${code}${extension}`)
    }
    // 四位纯数字目录编号只有整 token 命中才算课程，后缀不能被并进来。
    for (const code of ['6031', '6824']) {
      assert.deepEqual(extractCodes(`${code}${extension}`, known), [code], `${code}${extension}`)
    }
  }
  // 含数字的后缀只能枚举：漏一个就会把后缀并进课程码（6.824.h263）或整段吞掉（6031.m3u）。
  for (const extension of ['.m4r', '.h263', '.m2v', '.m3u', '.m3u8', '.mpeg4', '.mp2', '.azw3', '.par2', '.lz4', '.ps1', '.qcow2']) {
    for (const code of ['6.824', '6.S081', '15-445']) {
      assert.deepEqual(extractCodes(`${code}${extension}`, known), [code], `${code}${extension}`)
    }
    assert.deepEqual(extractCodes(`6031${extension}`, known), ['6031'], `6031${extension}`)
  }
  // 数字分卷（.001 / .z01 / .r01）跟完整课程号后面时是后缀；单个数字续段仍是 lab 号（6.824.2）。
  for (const suffix of ['.001', '.z01', '.r01']) {
    assert.deepEqual(extractCodes(`6.824${suffix}`, known), ['6.824'], `6.824${suffix}`)
    assert.deepEqual(extractCodes(`6031${suffix}`, known), ['6031'], `6031${suffix}`)
    assert.deepEqual(extractCodes(`lab-6.S081${suffix}`, known), ['6.S081'], `lab-6.S081${suffix}`)
  }
  // 点后字母 + 连字符 + 数字是课程码自己的续段（CS-61B），不能当成后缀掩掉。
  assert.deepEqual(extractCodes('lab03.CS-61B.pdf', known), ['CS-61B'])
  assert.deepEqual(extractCodes('6.824.2.pdf', known), ['6.824.2'])
  // 四位编号后面跟混合后缀（.bz2 / .mpeg2 / .m4a）同样不吞编号：目录编号自身没有点段，
  // 靠枚举这些后缀总会漏（bz2、mpeg2 都漏过），所以按「点后带字母」判定。
  for (const extension of ['.bz2', '.bzip2', '.mpeg2', '.m4a', '.mp42']) {
    for (const code of ['6031', '15213']) {
      assert.deepEqual(extractCodes(`${code}${extension}`, known), [code], `${code}${extension}`)
    }
  }
  // 纯数字尾巴不是后缀，而是更长的编号（6031.2 ≠ 6031），不能被截短成已有课程。
  assert.deepEqual(extractCodes('6031.2', known), [])
})

test('年份与日期后缀不被并入课程编号', () => {
  const known = new Set([...index.courseCodes, '6031'])
  for (const [resource, code] of [
    ['6.824.2024.pdf', '6.824'], ['6.824-2024.pdf', '6.824'], ['MIT6.824-2024.pdf', 'MIT6.824'],
    ['6.S081.2024.pdf', '6.S081'], ['15-445-2024.pdf', '15-445'], ['MIT6.824-2024-10-01.pdf', 'MIT6.824'],
    ['CS61B.2024.pdf', 'CS61B'], ['6031.2024.pdf', '6031']
  ]) {
    assert.deepEqual(extractCodes(resource, known), [code], resource)
    assert.deepEqual(new Set(extractCodes(`${resource} CS999`, known)), new Set([code, 'CS999']), resource)
  }
  // 三位数字续段不是年份，不能被当成日期后缀吞掉。
  assert.deepEqual(extractCodes('6.18.2024.pdf', known), [])
  assert.deepEqual(extractCodes('6.824.2.pdf', known), ['6.824.2'])
})

test('资源后缀过滤保留完整课程编号及目录中已有的同名编号', () => {
  const known = new Set([...index.courseCodes, '6031', '6824', 'lab03'])
  for (const [resource, code] of [['lab-6.S081', '6.S081'], ['lab_6.S999', '6.S999'], ['lab-6.824', '6.824'], ['lab-6.828', '6.828'], ['video-15-445', '15-445'], ['video-6031', '6031']]) {
    assert.deepEqual(new Set(extractCodes(`${resource} lab10.pdf CS999`, known)), new Set([code, 'CS999']), resource)
  }
  assert.deepEqual(extractCodes('LAB03.pdf', known), ['LAB03'])
  assert.deepEqual(extractCodes('LAB03-handout', known), ['LAB03'])
})

test('数字说明后缀和多段文件名不会产生假课程，过滤不越过独立词边界', () => {
  for (const resource of [
    'lab03-part01.pdf', 'lab03_part01.pdf', 'lab03.part01.pdf', 'lab03--part01.pdf',
    'video10-part02.mp4', 'exam01-part01.pdf', 'cheat-sheet01-part02.pdf',
    'lab03-handout-part01-v1.0.0.pdf', 'lab03-part01', 'lab03-part01-lab04.pdf'
  ]) {
    assert.deepEqual(extractCodes(resource, index.courseCodes), [], resource)
    for (const separator of [' ', ', ', '/', '\n', '，']) {
      for (const term of [`CS61B ${resource}${separator}CS999`, `CS999${separator}${resource} CS61B`]) {
        assert.deepEqual(new Set(extractCodes(term, index.courseCodes)), new Set(['CS61B', 'CS999']), term)
      }
    }
  }
})

test('课程编号后的资源说明后缀不改变编号或吞掉相邻未知课程', () => {
  const known = new Set([...index.courseCodes, '6031', '6824'])
  for (const [resource, code] of [
    ['lab-6.S081-part01.pdf', '6.S081'], ['lab_6.S999_part01.pdf', '6.S999'],
    ['lab-6.824-part01.pdf', '6.824'], ['lab-6.828-part01.pdf', '6.828'],
    ['video-15-445-part02.mp4', '15-445'], ['video-6031-part02.mp4', '6031']
  ]) {
    assert.deepEqual(extractCodes(resource, known), [code], resource)
    assert.deepEqual(new Set(extractCodes(`${resource} CS999`, known)), new Set([code, 'CS999']), resource)
  }
})

test('资源形状的目录编号优先于后缀过滤，并优先匹配完整标识', () => {
  const known = new Set(['lab03', 'lab03part01', 'lab03part01lab04'])
  assert.deepEqual(extractCodes('LAB03-part02.pdf', known), ['LAB03'])
  assert.deepEqual(extractCodes('LAB03-part01', known), ['LAB03-part01'])
  assert.deepEqual(extractCodes('LAB03-part01-lab04', known), ['LAB03-part01-lab04'])
  assert.deepEqual(new Set(extractCodes('LAB03-part01 CS999', known)), new Set(['LAB03-part01', 'CS999']))
})

test('资源后缀保留明确课程号，说明数字与课程号交错时仍能区分', () => {
  const known = new Set([...index.courseCodes, '6031', 'n2t', 'nand2tetris', 'games101'])
  for (const code of ['CS61B', 'CS999', 'CS-61B', 'MIT6.S081', 'MIT6.S999', 'CMU10-414', 'GAMES999', '6031', 'N2T', 'Nand2Tetris']) {
    for (const separator of ['-', '_', '.']) {
      for (const term of [
        `lab03${separator}${code}.pdf`,
        `lab03-part01${separator}${code}-part02-v11.22.33.pdf`,
        `video10${separator}${code}-part02.mp4`
      ]) {
        assert.deepEqual(extractCodes(term, known), [code], term)
      }
    }
  }
  assert.deepEqual(extractCodes('lab03-CS999.pdf'), ['CS999'])
  assert.deepEqual(extractCodes('lab03-MIT6.S081.pdf'), ['MIT6.S081'])
  assert.deepEqual(new Set(extractCodes('lab03-CS61B-part01-CS999.pdf', known)), new Set(['CS61B', 'CS999']))
  assert.deepEqual(new Set(extractCodes('lab-6.S081-part01-CS999.pdf', known)), new Set(['6.S081', 'CS999']))
})

test('后缀课程识别不从说明词、版本或更长编号中截取目录简称', () => {
  const known = new Set([...index.courseCodes, '6031', 'n2t', 'nand2tetris'])
  for (const suffix of ['part01', 'part01-lab04', 'v11.22.33', 'handout-v6.0.31', 'handout-6.0.31', 'revision-6.0.31', 'NumPy1.26.4', 'prefixCS61Bsuffix', 'CS61B2', 'N2T-2', 'Nand2TetrisExtra']) {
    const term = `lab03-${suffix}.pdf`
    assert.deepEqual(extractCodes(term, known), [], term)
    assert.deepEqual(extractCodes(`${term} CS999`, known), ['CS999'], term)
  }
  assert.deepEqual(extractCodes('lab03-MIT6.S081X.pdf', known), ['MIT6.S081X'])
  assert.deepEqual(extractCodes('lab03-CS61B-NumPy1.26.4-part01.pdf', known), ['CS61B'])
})

test('资源后缀的版本标记跨分隔符生效，不吞掉版本后的课程号', () => {
  const known = new Set([...index.courseCodes, '6031', '6824', 'n2t'])
  for (const marker of ['v', 'V', 'version', 'VERSION']) {
    for (const separator of ['_', '-', '.', '__']) {
      for (const version of ['6031', '6.031', '6.0.31', '6_0_31', '6.824']) {
        const resource = `lab03-${marker}${separator}${version}.pdf`
        assert.deepEqual(extractCodes(resource, known), [], resource)
        assert.deepEqual(new Set(extractCodes(`CS61B ${resource} CS999`, known)), new Set(['CS61B', 'CS999']), resource)
        assert.deepEqual(extractCodes(`lab03-${marker}${separator}${version}_CS_999.pdf`, known), ['CS_999'], resource)
      }
    }
  }
  assert.deepEqual(extractCodes('lab03-v_6.031_N_2T.pdf', known), ['N_2T'])
})

test('资源词后的完整数字分段不截短为已知课程，仍识别独立后缀课程', () => {
  const known = new Set([...index.courseCodes, '6031', '15213'])
  for (const number of ['6031.2', '6031-2', '6031.6031', '6031-6031', '15213.2']) {
    const resource = `video-${number}.mp4`
    assert.deepEqual(extractCodes(resource, known), [], resource)
    assert.deepEqual(extractCodes(`${resource} CS61B`, known), ['CS61B'], resource)
    assert.deepEqual(extractCodes(`video-${number}-CS_999.mp4`, known), ['CS_999'], resource)
  }
  for (const number of ['6031', '15213', '6.031', '6.S081', '15-445']) {
    assert.deepEqual(extractCodes(`video-${number}-part02.mp4`, known), [number])
  }
  assert.deepEqual(extractCodes('video-6031.2.mp4', new Set([...known, '60312'])), ['6031.2'])
})

test('下划线数字续段完整读取，不恢复短编号或吞掉独立课程号', () => {
  const known = new Set([...index.courseCodes, '6031', '15213', 'n2t'])
  for (const number of ['6031_2', '6031__2', '6031_6031', '6031_2.3', '6031_2_3', '15213_2']) {
    for (const prefix of ['video-', 'video_', 'lab-']) {
      const resource = `${prefix}${number}.mp4`
      assert.deepEqual(extractCodes(resource, known), [], resource)
      assert.deepEqual(extractCodes(`CS61B ${resource}`, known), ['CS61B'], resource)
      assert.deepEqual(extractCodes(`${prefix}${number}_CS_999.mp4`, known), ['CS_999'], resource)
      assert.deepEqual(extractCodes(`${prefix}${number}_N2T.mp4`, known), ['N2T'], resource)
      assert.deepEqual(extractCodes(`${prefix}${number}_N_2T.mp4`, known), ['N_2T'], resource)
    }
  }
  assert.deepEqual(extractCodes('video-6031_part02.mp4', known), ['6031'])
  assert.deepEqual(extractCodes('video-6031_2.mp4', new Set([...known, '60312'])), ['6031_2'])
})

test('短资源序号后的数字课程号独立识别，序号分隔写法保持一致', () => {
  const known = new Set([...index.courseCodes, '6031', '15445', '6042j'])
  for (const prefix of ['video10', 'video-10', 'video_10', 'lab03', 'lab-03', 'lab_03']) {
    for (const code of ['6031', '6.031', '6.S081', '15-445', '6.042J']) {
      for (const separator of ['_', '__']) {
        const resource = `${prefix}${separator}${code}.pdf`
        assert.deepEqual(extractCodes(resource, known), [code], resource)
        assert.deepEqual(new Set(extractCodes(`${prefix}${separator}${code}_CS_999.pdf`, known)), new Set([code, 'CS_999']), resource)
      }
    }
  }
})

test('资源序号后的数字课程也验证完整边界，完整目录编号仍然优先', () => {
  const known = new Set([...index.courseCodes, '6031', '10414', 'n2t'])
  for (const prefix of ['video10', 'video-10', 'video_10']) {
    for (const number of ['6031_2', '6031__2', '6031.2', '6031-2', '6031_6031', '6031_2a_6031', '6031_2abc_6031', '6031_2a3_6031']) {
      const resource = `${prefix}_${number}.mp4`
      assert.deepEqual(extractCodes(resource, known), [], resource)
      assert.deepEqual(extractCodes(`${prefix}_${number}_CS_999.mp4`, known), ['CS_999'], resource)
      assert.deepEqual(extractCodes(`${prefix}_${number}_N2T.mp4`, known), ['N2T'], resource)
    }
  }
  assert.deepEqual(extractCodes('video-6031_6031.mp4', known), [])
  assert.deepEqual(extractCodes('video-6031_2a_6031.mp4', known), [])
  assert.deepEqual(extractCodes('video-6032_6031.mp4', known), [])
  assert.deepEqual(extractCodes('video-10_6031.mp4', new Set([...known, '10'])), [])
  assert.deepEqual(extractCodes('video-10_414.mp4', known), ['10_414'])
  assert.deepEqual(extractCodes('video-10_6031_2.mp4', new Set([...known, '60312'])), ['6031_2'])
  assert.deepEqual(extractCodes('video-10_6031.mp4', new Set([...known, 'video106031'])), ['video-10_6031'])
})

test('补零资源序号不吞掉后续数字课程号，分隔符与字母后缀保持兼容', () => {
  const known = new Set([...index.courseCodes, '6031', '15445', '6042j'])
  for (const ordinal of ['0010', '0003', '0000', '000123', '0003a']) {
    for (const prefix of ['video', 'video-', 'video_', 'lab_']) {
      for (const separator of ['_', '__']) {
        for (const code of ['6031', '6.031', '6.S081', '15-445', '6.042J']) {
          const resource = `${prefix}${ordinal}${separator}${code}`
          assert.deepEqual(extractCodes(`${resource}.pdf`, known), [code], resource)
          assert.deepEqual(new Set(extractCodes(`${resource}_CS_999.pdf`, known)), new Set([code, 'CS_999']), resource)
        }
      }
    }
  }
})

test('五位补零资源序号不被当成课程编号', () => {
  const known = new Set([...index.courseCodes, '6031', '15445'])
  for (const ordinal of ['00003', '00042', '00000', '00123']) {
    assert.deepEqual(extractCodes(ordinal, known), [], ordinal)
    for (const prefix of ['video', 'video-', 'video_', 'lab-', 'lab_', 'exam-', '第']) {
      for (const extension of ['', '.mp4', '.pdf']) {
        const resource = `${prefix}${ordinal}${extension}`
        assert.deepEqual(extractCodes(resource, known), [], resource)
        // 序号旁边的真实课程号既不丢也不降级。
        assert.deepEqual(extractCodes(`${resource} CS61B`, known), ['CS61B'], resource)
        assert.deepEqual(extractCodes(`CS61B ${resource}`, known), ['CS61B'], resource)
      }
    }
  }
  // 目录里真有的补零编号仍按目录标识保留。
  assert.deepEqual(extractCodes('video-00042.mp4', new Set([...known, '00042'])), ['00042'])
  // 首位非零的五位课程码不受影响。
  for (const code of ['15213', '15799']) {
    assert.deepEqual(extractCodes(`video-${code}.mp4`, known), [code], code)
  }
})

test('补零序号只放宽序号长度判断，课程编号与数字续段仍完整保留', () => {
  const known = new Set([...index.courseCodes, '6031'])
  for (const prefix of ['video0010', 'video-0010', 'video_0010']) {
    for (const number of ['6031_2', '6031__2', '6031.2', '6031-2', '6031_6031', '6031_2a_6031']) {
      const resource = `${prefix}_${number}`
      assert.deepEqual(extractCodes(`${resource}.mp4`, known), [], resource)
      assert.deepEqual(extractCodes(`${resource}_CS_999.mp4`, known), ['CS_999'], resource)
    }
  }
  for (const number of ['006031_2', '006031_6031', '0001000_6031']) {
    assert.deepEqual(extractCodes(`video-${number}.mp4`, known), [], number)
  }
  for (const ordinal of ['0010', '0003']) {
    const catalog = new Set([...known, ordinal])
    assert.deepEqual(extractCodes(`video-${ordinal}.mp4`, catalog), [ordinal])
    assert.deepEqual(extractCodes(`video-${ordinal}_6031.mp4`, catalog), [])
  }
  assert.deepEqual(extractCodes('video-0010_006031.mp4', known), [])
  assert.deepEqual(extractCodes('video-0010_006031.mp4', new Set([...known, '006031'])), ['006031'])
  assert.deepEqual(extractCodes('video-0010_6031_2.mp4', new Set([...known, '60312'])), ['6031_2'])
  assert.deepEqual(extractCodes('video-0010_6031.mp4', new Set([...known, '00106031'])), ['0010_6031'])
  assert.deepEqual(extractCodes('video-0010_6031.mp4', new Set([...known, 'video00106031'])), ['video-0010_6031'])
})

test('资源后缀保留带下划线的完整院系编号，不匹配更长标识的片段', () => {
  const known = new Set([...index.courseCodes, 'n2t', 'games101', 'cmu10414'])
  for (const code of ['CS_61B', 'CS_999', 'CS__999', 'MIT_6.S081', 'MIT_6.S999', 'CMU_10-414', 'GAMES_999', 'N_2T']) {
    for (const term of [`lab03-${code}.pdf`, `lab03_part01_${code}_part02.pdf`]) {
      assert.deepEqual(extractCodes(term, known), [code], term)
    }
  }
  for (const code of ['prefixCS_61Bsuffix', 'CS_61B2', 'N_2T-2']) {
    assert.deepEqual(extractCodes(`lab03-${code}.pdf`, known), [], code)
  }
  assert.deepEqual(extractCodes('lab03-CS_999.pdf'), ['CS_999'])
  assert.deepEqual(extractCodes('lab03-MIT_6.S999.pdf'), ['MIT_6.S999'])
})

test('语言名后的已知完整课程号优先于模糊版本号，明确版本仍排除', () => {
  const known = new Set(['6031', '6824', 'cs61b'])
  for (const code of ['6.031', '6031', '6.824']) {
    for (const language of ['Java', 'Python']) {
      assert.deepEqual(extractCodes(`${language} ${code} 视频`, known), [code])
      assert.deepEqual(extractCodes(`${code} ${language} 视频`, known), [code])
      for (const version of [`${language}${code}`, `${language}-${code}`, `${language} v${code}`, `${language} version ${code}`]) {
        assert.deepEqual(extractCodes(version, known), [], version)
      }
    }
  }
  for (const version of ['Python 3.6031', 'Java 6.031.1', 'Java 60310', 'Java 17', 'Python 3.10']) {
    assert.deepEqual(extractCodes(version, known), [], version)
  }
  assert.deepEqual(extractCodes('Java 6.031 CS999', known), ['6.031', 'CS999'])
})

test('空格编号支持目录前缀和未知 EECS 编号，并保持完整边界', () => {
  const known = new Set(['games101', 'data100', 'aut1400', 'n2t', 'eecs498007'])
  for (const code of ['GAMES 101', 'GAMES\u3000101', 'games-101', 'Data 100', 'AUT 1400', 'N 2T', 'EECS 16A', 'EECS\t16A', 'EECS 999', 'GAMES 999']) {
    assert.deepEqual(extractCodes(`${code} 视频`, known), [code], code)
  }
  assert.deepEqual(extractCodes('EECS 16A'), ['EECS 16A'])
  assert.deepEqual(extractCodes('STA 4273 Winter 2021', known), [])
  assert.deepEqual(extractCodes('prefixGAMES 101 GAMES 101suffix', known), [])
  assert.deepEqual(extractCodes('GAMES 1010 EECS 16AA', known), ['GAMES 1010', 'EECS 16AA'])
  assert.equal(extractCodes('N 2T-2', known).some(code => normalizeTerm(code) === 'n2t'), false)
})

test('共享编号由所有编号和完整标题共同消歧，不取另一门课的首个命中', () => {
  const intro = entry({ kind: 'course', path: '/course/intro', label: 'CS50: This is CS50x', codes: ['cs50', 'cs50x'], capabilities: ['roadmap'] })
  const ai = entry({ kind: 'course', path: '/course/ai', label: 'CS50 Introduction to AI with Python', codes: ['cs50'] })
  const other = entry({ kind: 'course', path: '/course/other', label: 'CS148', codes: ['cs148'] })
  for (const entries of [[ai, intro, other], [other, intro, ai]]) {
    const shared: ContentIndex = { entries, courseCodes: new Set(['cs50', 'cs50x', 'cs148']) }
    for (const term of ['CS50: This is CS50x 学习路线', 'CS50 CS50x 学习路线', 'CS50x CS50 学习路线']) {
      assert.equal(matchTerm(term, shared)?.entry.path, intro.path, term)
      assert.equal(analyzeSearchGaps([{ term, count: 1 }], shared).rows[0].status, 'covered', term)
    }
    for (const term of [ai.label, 'CS50 AI 视频', 'CS50 AI视频', 'CS50 Python 视频']) {
      assert.equal(matchTerm(term, shared)?.entry.path, ai.path, term)
    }
    assert.equal(matchTerm('CS50: This is CS50x CS999 学习路线', shared), undefined)
    assert.equal(matchTerm('CS50x CS148 视频', shared), undefined)
    assert.equal(matchTerm('CS148 CS50x 视频', shared), undefined)
  }
})

test('归一化合并不把有空格的课程需求与明确软件版本混为一条', () => {
  const construction = entry({ kind: 'course', path: '/course/6031', label: 'MIT 6.031', codes: ['6031'], capabilities: ['video'] })
  const known: ContentIndex = { entries: [construction], courseCodes: new Set(['6031']) }
  const queries = [
    { term: 'Java 6.031 视频', count: 3 },
    { term: 'Java 6031视频', count: 2 },
    { term: 'Java6.031 视频', count: 1 }
  ]
  for (const input of [queries, [...queries].reverse()]) {
    const report = analyzeSearchGaps(input, known)
    assert.equal(report.rows.length, 2)
    const course = report.rows.find(row => row.matched?.path === construction.path)
    assert.equal(course?.count, 5)
    assert.equal(course?.status, 'covered')
    assert.equal(report.rows.find(row => row.term === 'Java6.031 视频')?.status, 'missing_page')
  }
})

test('多段版本与课程编号即使归一化文本相同也不能合并计数', () => {
  const construction = entry({ kind: 'course', path: '/course/6031', label: 'MIT 6.031', codes: ['6031'], capabilities: ['video'] })
  const known: ContentIndex = { entries: [construction], courseCodes: new Set(['6031']) }
  const queries = [
    { term: 'Java 6.031 视频', count: 3 },
    { term: 'Java 6.0.31 视频', count: 2 },
    { term: 'Java6.0.31 视频', count: 1 }
  ]
  for (const input of [queries, [...queries].reverse()]) {
    const report = analyzeSearchGaps(input, known)
    assert.equal(report.rows.length, 2)
    assert.equal(report.summary.searches, 6)
    assert.deepEqual(report.missingCourses, [])
    const course = report.rows.find(row => row.status === 'covered')
    assert.equal(course?.matched?.path, construction.path)
    assert.equal(course?.count, 3)
    const version = report.rows.find(row => row.status === 'missing_page')
    assert.equal(version?.matched, null)
    assert.equal(version?.count, 3)
  }
})

test('detectIntents 认中英文意图词', () => {
  assert.deepEqual(detectIntents('cs61b 教材'), ['textbook'])
  assert.deepEqual(detectIntents('csapp 中文 pdf'), ['chinese', 'download'])
  assert.deepEqual(detectIntents('cs144 lab'), ['assignment'])
  assert.deepEqual(detectIntents('mit 6.824 笔记'), ['notes'])
  assert.deepEqual(detectIntents('操作系统 难吗'), ['difficulty'])
  assert.deepEqual(detectIntents('mit 6.s081 lab 答案'), ['assignment', 'answers'])
  assert.deepEqual(detectIntents('计算机 自学 路线'), ['roadmap'])
  assert.deepEqual(detectIntents('cs61b'), ['none'])
})

test('英文意图词不从软件名或普通单词内部提取', () => {
  for (const word of ['MATLAB2024', 'MATLAB', 'Colab', 'GitLab', 'notebook', 'example', 'finalize', 'projection', 'report', 'resolution']) {
    assert.deepEqual(detectIntents(word), ['none'], word)
    assert.deepEqual(detectIntents(`CS229 ${word} 视频`), ['video'], word)
  }
})

test('复合资源名称兼容连写、空格、连字符和复数，同时保留单词边界', () => {
  for (const term of ['cheatsheet', 'cheat sheet', 'cheat-sheet', 'cheat_sheets', 'CHEAT SHEETS', '课程cheat sheet笔记']) {
    assert.deepEqual(detectIntents(term), ['notes'], term)
  }
  for (const term of ['ebook', 'e-book', 'e book', 'e_books', 'E-BOOKS', '中文e-book']) {
    assert.deepEqual(detectIntents(term), term.startsWith('中文') ? ['chinese', 'download'] : ['download'], term)
  }
  for (const term of ['myebook', 'cheatsheeting', 'mycheat sheet', 'e-booklet', 'notebook']) {
    assert.deepEqual(detectIntents(term), ['none'], term)
  }
})

test('英文边界识别保留复数、带序号的资源和中英文相邻写法', () => {
  for (const term of ['lab3', 'labs', 'LAB03', 'lab3a', 'lab-3', 'project1', 'projects', 'practicals']) {
    assert.deepEqual(detectIntents(term), ['assignment'], term)
  }
  for (const term of ['videos', 'lectures']) assert.deepEqual(detectIntents(term), ['video'], term)
  for (const term of ['textbooks', 'text books', 'text-book']) assert.deepEqual(detectIntents(term), ['textbook'], term)
  for (const term of ['exams', 'quizzes', 'past papers', 'past-paper', 'midterms', 'finals', 'exam1']) {
    assert.deepEqual(detectIntents(term), ['exam'], term)
  }
  for (const term of ['repo', 'repos', 'repositories']) assert.deepEqual(detectIntents(term), ['github'], term)
  for (const term of ['prerequisites', 'prereqs']) assert.deepEqual(detectIntents(term), ['prerequisite'], term)
  for (const term of ['pdfs', 'ebooks', 'epubs']) assert.deepEqual(detectIntents(term), ['download'], term)
  assert.deepEqual(detectIntents('lecture notes'), ['video', 'notes'])
  assert.deepEqual(detectIntents('中文lab3视频'), ['video', 'assignment', 'chinese'])
  assert.deepEqual(detectIntents('GitLab上的lab3答案'), ['assignment', 'answers'])
})

test('边界产生不同意图时，归一化相同的查询仍分开统计', () => {
  const queries = [
    { term: 'CS61B notebook video', count: 3 },
    { term: 'CS61B note book video', count: 2 },
    { term: 'cs61b NOTE book VIDEO', count: 1 }
  ]
  for (const input of [queries, [...queries].reverse()]) {
    const report = analyzeSearchGaps(input, index)
    assert.equal(report.rows.length, 2)
    assert.equal(report.summary.searches, 6)
    const covered = report.rows.find(row => row.status === 'covered')
    assert.equal(covered?.count, 3)
    assert.deepEqual(covered?.intents, ['video'])
    const notes = report.rows.find(row => row.status === 'page_gap')
    assert.equal(notes?.count, 3)
    assert.deepEqual(notes?.missing, ['notes'])
  }
})

test('matchTerm 先认课程码，再分类、大学、枢纽', () => {
  const code = matchTerm('cs61b 教材', index)
  assert.equal(code?.entry.path, '/zh/course/data-structures-algorithms/CS61B')
  assert.equal(code?.via, 'code')

  const spaced = matchTerm('MIT 6.S081 实验', index)
  assert.equal(spaced?.entry.path, '/zh/course/operating-systems/MIT6.S081')
  assert.equal(spaced?.via, 'code')

  const category = matchTerm('数据库 课程推荐', index)
  assert.equal(category?.entry.path, '/zh/courses/database-systems')
  assert.equal(category?.via, 'category')

  const university = matchTerm('斯坦福 计算机 课程', index)
  assert.equal(university?.entry.path, '/zh/universities/stanford')

  const hub = matchTerm('计算机 学习路线', index)
  assert.equal(hub?.entry.path, '/zh/tutorial')

  // 3 个字符的英文键（vpn / mit）也要能命中
  assert.equal(matchTerm('vpn 教程', index)?.entry.path, '/zh/course/essential-tools/vpn')

  assert.equal(matchTerm('csdiy', index), undefined)
})

test('命中的页面有教材就算覆盖，没有就报缺口', () => {
  const report = analyzeSearchGaps(
    [
      { term: 'cs61b 教材', count: 5 },
      { term: 'mit 6.S081 教材', count: 2 }
    ],
    index
  )
  const byTerm = new Map(report.rows.map(row => [row.term, row]))
  const covered = byTerm.get('cs61b 教材')
  assert.equal(covered?.status, 'covered')
  assert.deepEqual(covered?.missing, [])

  const gap = byTerm.get('mit 6.S081 教材')
  assert.equal(gap?.status, 'page_gap')
  assert.deepEqual(gap?.missing, ['textbook'])
  assert.match(gap?.suggestion || '', /缺教材/)
})

test('笔记永远算缺口（站内没有笔记能力）', () => {
  const report = analyzeSearchGaps([{ term: 'cs61b 笔记', count: 1 }], index)
  assert.equal(report.rows[0].status, 'page_gap')
  assert.deepEqual(report.rows[0].missing, ['notes'])
  assert.equal(report.topMissing[0].capability, 'notes')
})

test('作业答案算缺口，但和 GitHub 代码分开', () => {
  const report = analyzeSearchGaps([{ term: 'cs61b lab 答案', count: 1 }], index)
  assert.deepEqual(report.rows[0].missing, ['answers'])
  assert.match(report.rows[0].suggestion, /不提供作业答案/)
})

test('站外课程码进 missing_course，站内没有对应页面进 missing_page', () => {
  const report = analyzeSearchGaps(
    [
      { term: '6.828 中文', count: 4 },
      { term: 'csdiy wiki', count: 3 }
    ],
    index
  )
  const byTerm = new Map(report.rows.map(row => [row.term, row]))
  const missingCourse = byTerm.get('6.828 中文')
  assert.equal(missingCourse?.status, 'missing_course')
  assert.equal(missingCourse?.missingCourse, '6.828')
  assert.match(missingCourse?.suggestion || '', /站内没有 6\.828/)
  assert.equal(byTerm.get('csdiy wiki')?.status, 'missing_page')

  assert.equal(report.summary.missingCourse, 1)
  assert.equal(report.summary.missingPage, 1)
  assert.equal(report.missingCourses[0].code, '6.828')
})

test('同词归一后合并计数，并按优先级排序', () => {
  const report = analyzeSearchGaps(
    [
      { term: 'cs61b 笔记', count: 2 },
      { term: 'CS61B笔记', count: 3 },
      { term: 'csdiy', count: 1 }
    ],
    index
  )
  const merged = report.rows.find(row => normalizeTerm(row.term) === 'cs61b笔记')
  assert.equal(merged?.count, 5)
  // 笔记属于政策缺口：次数再多也停在 P1，不占 P0 榜。
  assert.equal(merged?.priority, 'P1')
  assert.equal(merged?.policy, true)
  assert.equal(report.summary.terms, 2)
  assert.equal(report.summary.searches, 6)
})

test('政策缺口降一档并单独计数，能补的缺口仍占 P0', () => {
  const report = analyzeSearchGaps(
    [
      { term: 'cs61b 笔记', count: 9 },
      { term: 'mit 6.S081 教材', count: 9 },
      { term: '6.828 教材', count: 9 }
    ],
    index
  )
  const byTerm = new Map(report.rows.map(row => [row.term, row]))
  const policy = byTerm.get('cs61b 笔记')
  assert.equal(policy?.policy, true)
  assert.equal(policy?.priority, 'P1')
  // 建议动作不能自相矛盾：政策缺口说的是「改成什么」，不是「补什么」
  assert.match(policy?.suggestion || '', /站内不做笔记/)
  assert.doesNotMatch(policy?.suggestion || '', /补「笔记/)
  // 教材是真能补的缺口，次数够了就是 P0。
  assert.equal(byTerm.get('mit 6.S081 教材')?.policy, false)
  assert.equal(byTerm.get('mit 6.S081 教材')?.priority, 'P0')
  assert.equal(byTerm.get('6.828 教材')?.priority, 'P0')
  // 排序上政策缺口垫底，不挤占可行动项的头部。
  assert.equal(report.rows.at(-1)?.term, 'cs61b 笔记')
  assert.equal(report.summary.policyGap, 1)
  // 只是缺了「视频」这类真能力，不算政策缺口。
  const video = analyzeSearchGaps([{ term: 'mit 6.S081 视频', count: 1 }], index).rows[0]
  assert.equal(video.status, 'covered')
  assert.equal(video.policy, false)
})

test('报表能标出「判定已覆盖、但站内搜索搜不到」的词', () => {
  const hits = new Map([
    ['cs61b 教材', 0],
    ['cs61b 视频', 3]
  ])
  const report = analyzeSearchGaps(
    [
      { term: 'cs61b 教材', count: 4 },
      { term: 'cs61b 视频', count: 2 }
    ],
    index,
    { countSearchHits: term => hits.get(term) ?? 0 }
  )
  const byTerm = new Map(report.rows.map(row => [row.term, row]))
  assert.equal(byTerm.get('cs61b 教材')?.status, 'covered')
  assert.equal(byTerm.get('cs61b 教材')?.searchHits, 0)
  assert.equal(byTerm.get('cs61b 视频')?.searchHits, 3)
  assert.equal(report.summary.searchMiss, 1)

  // 没注入计数器时保持 null —— 不能让人误读成「搜索 0 条」。
  const plain = analyzeSearchGaps([{ term: 'cs61b 教材', count: 1 }], index).rows[0]
  assert.equal(plain.searchHits, null)
  assert.equal(analyzeSearchGaps([{ term: 'cs61b 教材', count: 1 }], index).summary.searchMiss, 0)
})

test('minCount 会过滤长尾', () => {
  const report = analyzeSearchGaps(
    [
      { term: 'cs61b 教材', count: 5 },
      { term: 'random thing', count: 1 }
    ],
    index,
    { minCount: 2 }
  )
  assert.equal(report.rows.length, 1)
})

test('词表被缺口占满时，已覆盖与政策缺口的行不会被明细上限截掉', () => {
  const terms = [
    ...Array.from({ length: 250 }, (_, n) => ({ term: `CS${7000 + n} 教材`, count: 3 })),
    { term: 'CS61B 教材', count: 5 },
    { term: 'cs61b 视频', count: 4 },
    { term: 'cs61b 笔记', count: 9 }
  ]
  const report = analyzeSearchGaps(terms, index, {
    maxRows: 200,
    countSearchHits: term => (term === 'cs61b 视频' ? 0 : 1)
  })
  // 可行动项仍然只占 maxRows 条
  assert.equal(report.rows.filter(row => row.status !== 'covered' && !row.policy).length, 200)
  // 已覆盖与政策缺口各有额度，不会被 250 条真缺口挤掉
  assert.deepEqual(
    report.rows.filter(row => row.status === 'covered').map(row => row.term),
    ['CS61B 教材', 'cs61b 视频']
  )
  assert.equal(report.rows.filter(row => row.policy).length, 1)
  // 「覆盖但搜不到」在明细里找得到，跟 summary 对得上
  assert.equal(report.rows.find(row => row.searchHits === 0)?.term, 'cs61b 视频')
  assert.equal(report.summary.searchMiss, 1)
  assert.equal(report.summary.terms, 253)
  // 非 covered 行不再为命中数白跑一次搜索
  assert.equal(report.rows.find(row => row.term === 'cs61b 笔记')?.searchHits, null)
})

test('空输入不炸', () => {
  const report = analyzeSearchGaps([], index)
  assert.deepEqual(report.rows, [])
  assert.equal(report.summary.searches, 0)
  assert.deepEqual(report.topMissing, [])
})

test('不同缺口类型在同优先级下按搜索次数排序，截断不会隐藏最热需求', () => {
  const terms = [
    { term: 'CS61B 笔记', count: 1000 },
    ...Array.from({ length: 201 }, (_, n) => ({ term: `CS${8000 + n} 教材`, count: 3 }))
  ]
  for (const input of [terms, [...terms].reverse()]) {
    const report = analyzeSearchGaps(input, index, { maxRows: 200 })
    // 200 条非政策缺口占满额度，政策缺口另占额度：最热的「搜笔记」不会被截掉。
    assert.equal(report.rows.length, 201)
    assert.equal(report.rows[0].term, 'CS8000 教材')
    assert.equal(report.rows.at(-1)?.term, 'CS61B 笔记')
    assert.equal(report.rows.at(-1)?.priority, 'P1')
    assert.equal(report.summary.terms, 202)
    assert.equal(report.summary.searches, 1603)
  }
  const mixed = [
    { term: 'CS61B 教材', count: 1000 }, // Covered stays below actionable rows.
    { term: 'csdiy wiki', count: 1 },
    { term: 'CS61B 笔记', count: 1 },
    { term: 'CS8888', count: 1 }
  ]
  const forward = analyzeSearchGaps(mixed, index).rows.map(row => row.term)
  assert.deepEqual(analyzeSearchGaps([...mixed].reverse(), index).rows.map(row => row.term), forward)
  // 政策缺口统一垫底，covered 仍排在可行动项之后。
  assert.equal(forward.at(-1), 'CS61B 笔记')
  assert.equal(forward.filter(term => term !== 'CS61B 笔记').at(-1), 'CS61B 教材')
})

test('完整课程码匹配不接受数字片段、院校词或另一门课的前缀', () => {
  const broadIndex: ContentIndex = {
    entries: [
      ...index.entries,
      entry({ kind: 'course', path: '/course/MIT6.S184', label: 'MIT6.S184: Generative AI', keys: ['mit6', 'mit6s184'], capabilities: ['chinese'] }),
      entry({ kind: 'course', path: '/course/convex', label: 'Stanford EE364A: Convex Optimization', keys: ['stanford', 'ee364a'], capabilities: ['textbook'] })
    ],
    courseCodes: new Set([...index.courseCodes, 'mit6s184', '6s184', 'ee364a'])
  }
  for (const term of ['MIT 6.828 中文', 'MIT6.828 中文', 'Stanford CS107 教材', 'CS61BB 视频', 'CS61B CS999 教材']) {
    const row = analyzeSearchGaps([{ term, count: 3 }], broadIndex).rows[0]
    assert.equal(row.status, 'missing_course', term)
    assert.equal(row.matched, null, term)
  }
  for (const term of ['CS 61B 教材', 'cs-61b 教材', 'CS61B教材']) {
    assert.equal(matchTerm(term, broadIndex)?.entry.path, '/zh/course/data-structures-algorithms/CS61B', term)
  }
  assert.deepEqual(extractCodes('MIT6.S184 CMU10-414 CS106B_CS106X'), ['MIT6.S184', 'CMU10-414', 'CS106B', 'CS106X'])
  assert.deepEqual(extractCodes('prefixCS61Bsuffix CS61BBBB'), [])
})

test('资源序数标签不被当成课程编号，形状相同的未知课号仍然报告', () => {
  const known = new Set([...index.courseCodes, '6031'])
  // hw03 / part02 / week03 是资源序数，不是课程；「hw03 答案」不该报成缺课。
  for (const label of ['hw03', 'hws02', 'ps02', 'pset03', 'part02', 'week03', 'wk04', 'slide02',
    'unit04', 'ep01', 'episode02', 'day02', 'ta02', 'rec04', 'sec03', 'chap12', 'mod02', 'tut03']) {
    assert.deepEqual(extractCodes(label, known), [], label)
    assert.deepEqual(extractCodes(`${label} 视频`, index.courseCodes), [], label)
    const row = analyzeSearchGaps([{ term: `${label} 答案`, count: 3 }], index).rows[0]
    assert.notEqual(row.status, 'missing_course', `${label} 答案`)
  }
  // 形状完全相同的 CLAB03 是未知课号，不能被序数规则吃掉。
  assert.deepEqual(extractCodes('CLAB03.pdf', known), ['CLAB03'])
  // 目录里确实存在的序数形状短码仍要保留。
  assert.deepEqual(extractCodes('LAB03.pdf', new Set(['lab03'])), ['LAB03'])
})

test('四位目录编号后接分隔符与说明词仍识别为课程，更长的编号不被截短', () => {
  const known = new Set([...index.courseCodes, '6031', '6824', 'n2t', 'nand2tetris'])
  for (const [term, code] of [
    ['6031-final.pdf', '6031'],
    ['6031-lecture-05.pdf', '6031'],
    ['6031_hw2.pdf', '6031'],
    ['6824-assignment-3.pdf', '6824'],
    ['6031-lab1', '6031'],
    ['video-6031-part02.mp4', '6031']
  ]) {
    assert.deepEqual(extractCodes(term, known), [code], term)
  }
  // 数字尾巴是更长的编号，字母尾巴接在字母简称后面是更长的标识：都不能截短。
  for (const term of ['6031-2', '6031.2', 'Nand2Tetris-extra', 'N2T-2', 'Nand2TetrisExtra']) {
    assert.deepEqual(extractCodes(term, known), [], term)
  }
  // 没有目录集合时四位码一律不猜。
  assert.deepEqual(extractCodes('6031-final.pdf'), [])
})

test('全角输入按 NFKC 归一后再抽课程号，点分四段数字不当课程', () => {
  const known = new Set(['cs61b', '6824', '15445', '6s081'])
  // 中文输入法下的全角字母/数字/标点：字符码点不同，但 NFKC 之后就是普通课程号。
  assert.deepEqual(extractCodes('ＣＳ６１Ｂ 教材', known), ['ＣＳ６１Ｂ'])
  assert.deepEqual(extractCodes('６．８２４ 视频', known), ['６．８２４'])
  assert.deepEqual(extractCodes('１５－４４５', known).map(normalizeTerm), ['15445'])
  assert.deepEqual(extractCodes('ＣＳ６１Ｂ', known).map(normalizeTerm), ['cs61b'])
  // 全角与半角混写也要命中同一门课。
  assert.deepEqual(extractCodes('ｃｓ61b', known).map(normalizeTerm), ['cs61b'])
  // 点分四段纯数字是 IPv4，不是课程编号；真正的多段编号最多三段。
  for (const text of ['192.168.1.1', '192.168.1.1 配置', '10.0.0.1', '255.255.255.0 教程']) {
    assert.deepEqual(extractCodes(text, known), [], text)
  }
  assert.deepEqual(extractCodes('6.824.2', known), ['6.824.2'])
  assert.deepEqual(extractCodes('6.824', known), ['6.824'])
})

test('全角查询在 matchTerm 里落到同一门课', () => {
  const index: ContentIndex = {
    entries: [entry({ kind: 'course', path: '/course/cs61b', label: 'CS61B', codes: ['cs61b'] })],
    courseCodes: new Set(['cs61b'])
  }
  for (const term of ['ＣＳ６１Ｂ 教材', 'ｃｓ６１ｂ 视频', 'ＣＳ61Ｂ']) {
    assert.equal(matchTerm(term, index)?.entry.path, '/course/cs61b', term)
  }
  assert.equal(matchTerm('192.168.1.1', index), undefined)
})
