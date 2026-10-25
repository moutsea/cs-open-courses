import catalog from '@/data/course-videos.json'

interface VideoResource {
  url: string
  title: { zh: string; en: string }
  kind: string
  official: boolean
  source: string
}

const courses: Record<string, VideoResource[]> = catalog.courses
const scopes: Record<string, { zh: string; en: string }> = {
  playlist: { zh: '课堂合集', en: 'Lecture playlist' },
  collection: { zh: '视频合集', en: 'Video collection' },
  chapter: { zh: '章节合集', en: 'Chapter playlist' },
  lecture: { zh: '单节课', en: 'Single lecture' },
  supplemental: { zh: '补充讲座', en: 'Supplemental talks' }
}

export default function CourseVideoResources({ coursePath, locale }: { coursePath: string; locale: string }) {
  const videos = courses[coursePath] || []
  if (!videos?.length) return null
  const language = locale === 'zh' ? 'zh' : 'en'
  const isChinese = language === 'zh'

  return <section aria-labelledby="course-videos-title" className="mb-8 border-b border-white/15 pb-8">
    <h2 id="course-videos-title" className="text-2xl font-semibold">{isChinese ? '公开课视频' : 'Lecture videos'}</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-300">
      {isChinese ? '按标注年份选择视频，并配合相应版本的课程资料学习。' : 'Choose a course edition and use the materials from the same year.'}
    </p>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {videos.map(video => <li key={video.url} className="min-w-0 rounded-2xl border border-white/15 bg-white/5 p-4">
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
          <span>{video.url.includes('bilibili.com') ? (isChinese ? '哔哩哔哩' : 'Bilibili') : 'YouTube'}</span>
          <span>{video.official ? (isChinese ? '官方发布' : 'Official') : (isChinese ? '第三方转载' : 'Community mirror')}</span>
          <span>{scopes[video.kind]?.[language]}</span>
        </div>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="block break-words font-medium leading-relaxed text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white">
          {video.title[language]}
        </a>
        {video.source !== video.url && <a href={video.source} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-slate-300 underline underline-offset-4 hover:text-white">
          {isChinese ? '课程资料与来源' : 'Course materials and source'}
        </a>}
      </li>)}
    </ul>
  </section>
}
