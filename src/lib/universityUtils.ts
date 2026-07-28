interface CourseWithUniversity {
  university?: string
}

const universityGroups = [
  { key: 'mit', aliases: ['mit', '麻省理工学院'] },
  { key: 'stanford', aliases: ['stanford'] },
  { key: 'uc-berkeley', aliases: ['uc berkeley', 'ucb', 'university of california, berkeley'] },
  { key: 'cmu', aliases: ['cmu', 'carnegie mellon', '卡内基梅隆大学'] },
  { key: 'harvard', aliases: ['harvard'] },
  { key: 'kaist', aliases: ['kaist'] },
  { key: 'caltech', aliases: ['caltech', 'california institute of technology'] },
  { key: 'cambridge', aliases: ['cambridge'] },
  { key: 'columbia', aliases: ['columbia university'] },
  { key: 'cornell', aliases: ['cornell'] },
  { key: 'duke', aliases: ['duke'] },
  { key: 'eth-zurich', aliases: ['eth zurich'] },
  { key: 'princeton', aliases: ['princeton'] },
  { key: 'toronto', aliases: ['u toronto', 'university of toronto'] },
  { key: 'ucsb', aliases: ['ucsb', 'university of california, santa barbara'] },
  { key: 'michigan', aliases: ['umich', 'university of michigan'] },
  { key: 'helsinki', aliases: ['university of helsinki'] },
  { key: 'sjtu', aliases: ['上海交通大学', 'shanghai jiao tong university'] },
  { key: 'ustc', aliases: ['中国科学技术大学', 'ustc', 'university of science and technology of china'] },
  { key: 'ucas', aliases: ['中国科学院大学', 'university of chinese academy of sciences'] },
  { key: 'peking', aliases: ['北京大学', 'peking university'] },
  { key: 'nanjing', aliases: ['南京大学', 'nanjing university'] },
  { key: 'hit', aliases: ['哈尔滨工业大学', 'harbin institute of technology'] },
  { key: 'ntu', aliases: ['國立台灣大學', 'national taiwan university'] },
  { key: 'wisconsin', aliases: ['威斯康星大学麦迪逊分校', 'university of wisconsin, madison'] },
  { key: 'hebrew', aliases: ['希伯来大学', 'hebrew university of jerusalem'] },
  { key: 'syracuse', aliases: ['雪城大学', 'syracuse university'] },
  { key: 'umass', aliases: ['马萨诸塞大学', 'umass'] },
  { key: 'arizona-state', aliases: ['arizona state university'] },
  { key: 'amirkabir', aliases: ['amirkabir university of technology'] },
  { key: 'oregon-state', aliases: ['style3d/osu', 'oregon state university'] }
]

const ignoredUniversityValues = ['online course', 'bilibili 大学']

function getUniversityKeys(university: string): string[] {
  const normalizedUniversity = university.trim().replace(/^·+/, '').toLowerCase()
  if (!normalizedUniversity || ignoredUniversityValues.includes(normalizedUniversity)) return []

  const matchedKeys = universityGroups
    .filter(group => group.aliases.some(alias => normalizedUniversity.includes(alias)))
    .map(group => group.key)

  return matchedKeys.length > 0 ? [...new Set(matchedKeys)] : [normalizedUniversity]
}

export function countUniversities(courses: CourseWithUniversity[]): number {
  const universityKeys = new Set(courses.flatMap(course => course.university ? getUniversityKeys(course.university) : []))
  return universityKeys.size
}

export function countUniversityCourses(courses: CourseWithUniversity[], universityKey: string): number {
  return courses.filter(course => (
    course.university ? getUniversityKeys(course.university).includes(universityKey) : false
  )).length
}

export function countUniversityCoursesByName(courses: CourseWithUniversity[], universityName: string): number {
  const universityKeys = getUniversityKeys(universityName)

  return courses.filter(course => {
    if (!course.university) return false

    const courseUniversityKeys = getUniversityKeys(course.university)
    return courseUniversityKeys.some(key => universityKeys.includes(key))
  }).length
}
