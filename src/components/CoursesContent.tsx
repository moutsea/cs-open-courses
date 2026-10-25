'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Category, Course } from '@/lib/courseParser';
import { slugLabel } from '@/lib/categoryMapping';
import { buildDynamicRoutePath, localizedPath } from '@/lib/pathUtils';
import { difficultyLabel, formatHours } from '@/lib/courseFacts';
import { track } from '@/lib/analytics';

interface CoursesContentProps {
  categories: Category[];
  locale: string;
}

const PAGE_SIZE = 24;

const DIFFICULTY_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const SORT_STORAGE_KEY = 'cs61b-courses-sort';

/**
 * 筛选与排序写进 URL 的参数名。
 *
 * 不能叫 `category` / `subcategory`：`src/lib/catalogRedirect.ts` 会把 `/courses?category=…`
 * 这类旧目录地址 308 跳到分类落地页，新参数会被那条规则抢走。
 */
const FILTER_PARAM = 'filter';
const SORT_PARAM = 'sort';

type SortMode = 'difficulty' | 'title';

/** `?filter=分类/子分类`；只给分类时子分类为 null。 */
function parseFilterParam(value: string | null): { category: string | null; subcategory: string | null } {
  if (!value) return { category: null, subcategory: null };
  const [category, subcategory] = value.split('/');
  return { category: category || null, subcategory: subcategory || null };
}

function filterParamValue(category: string | null, subcategory: string | null): string | null {
  if (!category) return null;
  return subcategory ? `${category}/${subcategory}` : category;
}

function parseSortParam(value: string | null): SortMode | null {
  return value === 'title' || value === 'difficulty' ? value : null;
}

/** 「难度优先」按入门→高阶递进；「名称」纯按标题。同档时都用当前语言的字母序。 */
function sortCourses(list: Course[], isZh: boolean, mode: SortMode): Course[] {
  const collator = isZh ? 'zh-CN' : 'en';
  return [...list].sort((a, b) => {
    if (mode === 'difficulty') {
      const rankA = DIFFICULTY_RANK[(a.difficulty || '').toLowerCase()] ?? 3;
      const rankB = DIFFICULTY_RANK[(b.difficulty || '').toLowerCase()] ?? 3;
      if (rankA !== rankB) return rankA - rankB;
    }
    return a.title.localeCompare(b.title, collator);
  });
}

export default function CoursesContent({ categories, locale }: CoursesContentProps) {
  const isZh = locale === 'zh';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('difficulty');
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const pickerButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const totalCourses = useMemo(
    () => categories.reduce((sum, category) => sum + category.courses.length, 0),
    [categories]
  );

  const activeCategory = useMemo(
    () => categories.find(category => category.slug === selectedCategory) ?? null,
    [categories, selectedCategory]
  );

  const activeSubcategory = useMemo(() => {
    if (!activeCategory || !selectedSubcategory) return null;
    return activeCategory.subcategories.find(sub => sub.slug === selectedSubcategory) ?? null;
  }, [activeCategory, selectedSubcategory]);

  // 切换筛选或排序时回到第一页
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedSubcategory, sortMode]);

  /**
   * 挂载后从地址栏恢复筛选与排序（分享链接、刷新、后退回来都要还原），
   * 排序再退回 localStorage 的偏好。先用默认值渲染，避免 hydration 不一致。
   */
  const initialisedRef = useRef(false);
  /** 首次挂载时的查询串。StrictMode 会把 effect 跑两遍，第二遍地址栏已被同步 effect 改过。 */
  const initialSearchRef = useRef<string | null>(null);
  const applyFromSearch = useCallback((search: string) => {
    const params = new URLSearchParams(search);
    const wanted = parseFilterParam(params.get(FILTER_PARAM));
    const category = categories.find(item => item.slug === wanted.category) ?? null;
    const subcategory = wanted.subcategory
      ? category?.subcategories.find(item => item.slug === wanted.subcategory) ?? null
      : null;
    setSelectedCategory(category?.slug ?? null);
    setSelectedSubcategory(subcategory?.slug ?? null);
    const sortFromUrl = parseSortParam(params.get(SORT_PARAM));
    if (sortFromUrl) {
      setSortMode(sortFromUrl);
      return;
    }
    try {
      const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
      if (stored === 'difficulty' || stored === 'title') setSortMode(stored);
    } catch {
      // Storage may be blocked; the default sort remains usable.
    }
  }, [categories]);

  useEffect(() => {
    if (initialSearchRef.current === null) initialSearchRef.current = window.location.search;
    applyFromSearch(initialSearchRef.current);
    initialisedRef.current = true;
  }, [applyFromSearch]);

  // 站内后退/前进回到 /courses 的同一个实例时，也要跟着 URL 走。
  useEffect(() => {
    const handlePopState = () => applyFromSearch(window.location.search);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyFromSearch]);

  /**
   * 把筛选/排序同步进 URL：用 replaceState 而不是 router.replace，
   * 避免为了一个纯客户端筛选去重新请求服务端组件；也保证不新增历史条目。
   * canonical 仍由服务端固定成 /courses，索引交给 /courses/[category] 落地页。
   */
  useEffect(() => {
    if (!initialisedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const filter = filterParamValue(selectedCategory, selectedSubcategory);
    if (filter) params.set(FILTER_PARAM, filter);
    else params.delete(FILTER_PARAM);
    if (sortMode === 'difficulty') params.delete(SORT_PARAM);
    else params.set(SORT_PARAM, sortMode);
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState(window.history.state, '', next);
  }, [selectedCategory, selectedSubcategory, sortMode]);

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    try {
      // Persist explicit choices, never the initial value before storage is read.
      window.localStorage.setItem(SORT_STORAGE_KEY, mode);
    } catch {
      // Keep the choice in memory when storage is blocked or full.
    }
  };

  // 移动端下拉：点外部或按 Esc 收起
  useEffect(() => {
    if (!isPickerOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setIsPickerOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsPickerOpen(false);
      // 和搜索面板一致：Esc 收起后焦点回到触发按钮，键盘用户不会掉到页面顶端。
      pickerButtonRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPickerOpen]);

  // 视口跨到桌面断点时收起移动端下拉，避免状态残留
  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsPickerOpen(false);
    };
    desktopQuery.addEventListener('change', handleChange);
    return () => desktopQuery.removeEventListener('change', handleChange);
  }, []);

  // 选中的分类可能在侧栏滚动区之外，选中后滚到可视范围
  useEffect(() => {
    if (!selectedCategory) return;
    const timer = window.setTimeout(() => {
      activeItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [selectedCategory]);

  const courses = useMemo<Course[]>(() => {
    const list = activeSubcategory
      ? activeSubcategory.courses
      : activeCategory
        ? activeCategory.courses
        : categories.flatMap(category => category.courses);
    return sortCourses(list, isZh, sortMode);
  }, [activeCategory, activeSubcategory, categories, isZh, sortMode]);

  const visibleCourses = courses.slice(0, visibleCount);
  const remaining = courses.length - visibleCourses.length;

  const categoryName = (category: Category) => slugLabel(category.slug, isZh ? 'zh' : 'en');

  const subcategoryName = (sub: { name: string; slug: string }) => slugLabel(sub.slug, isZh ? 'zh' : 'en');

  const heading = activeSubcategory
    ? subcategoryName(activeSubcategory)
    : activeCategory
      ? categoryName(activeCategory)
      : isZh
        ? '全部课程'
        : 'All courses';

  /**
   * 侧栏用真实 <a> 渲染，保证 25 个分类页仍有站内链接可被爬取；
   * 普通左键点击时拦截，改成原地筛选，不跳页。带修饰键时保留原生行为。
   */
  const handleFilterClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    slug: string | null,
    subSlug: string | null = null
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    track('course_filter', { category: slug || 'all', subcategory: subSlug || '' });
    setSelectedCategory(slug);
    setSelectedSubcategory(subSlug);
  };

  const seoPageHref = activeCategory
    ? localizedPath(locale, `/courses/${activeCategory.slug}${activeSubcategory ? `/${activeSubcategory.slug}` : ''}`)
    : null;

  const itemClass =
    'group flex min-w-0 items-baseline justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/25 hover:bg-white/10';
  const metaClass = 'shrink-0 text-right text-xs leading-5 text-white/50';
  const sideItemBase = 'block w-full rounded-2xl border px-4 py-3 text-left transition';
  const sideItemIdle = 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5';
  const sideItemActive = 'border-white/25 bg-white/10 text-white';
  const sideSubItemBase = 'block w-full rounded-xl border px-3 py-2 text-left text-sm transition';
  const sideSubItemIdle = 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white';
  const sideSubItemActive = 'border-white/25 bg-white/10 text-white';

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="sticky top-8 hidden max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:block">
        <p className="text-xs uppercase tracking-[0.4em] text-white/45">{isZh ? '分类' : 'Categories'}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{isZh ? '按方向筛选' : 'Filter by track'}</h2>

        <div className="mt-4 max-h-[calc(100vh-16rem)] space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          <Link
            href={localizedPath(locale, '/courses')}
            onClick={event => handleFilterClick(event, null)}
            aria-current={!selectedCategory ? 'true' : undefined}
            className={`${sideItemBase} ${!selectedCategory ? sideItemActive : sideItemIdle}`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{isZh ? '全部课程' : 'All courses'}</span>
              <span className="text-xs text-white/50">{totalCourses}</span>
            </span>
          </Link>

          {categories.map(category => {
            const active = selectedCategory === category.slug;
            return (
              <div key={category.slug}>
                <Link
                  ref={active ? activeItemRef : undefined}
                  href={localizedPath(locale, `/courses/${category.slug}`)}
                  onClick={event => handleFilterClick(event, active ? null : category.slug)}
                  aria-current={active ? 'true' : undefined}
                  className={`${sideItemBase} ${active ? sideItemActive : sideItemIdle}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{categoryName(category)}</span>
                    <span className="text-xs text-white/50">{category.courses.length}</span>
                  </span>
                </Link>

                {active && category.subcategories.length > 0 && (
                  <div className="mt-1.5 space-y-1 rounded-2xl border border-dashed border-white/15 bg-white/5 p-2">
                    <Link
                      href={localizedPath(locale, `/courses/${category.slug}`)}
                      onClick={event => handleFilterClick(event, category.slug)}
                      aria-current={!selectedSubcategory ? 'true' : undefined}
                      className={`${sideSubItemBase} ${!selectedSubcategory ? sideSubItemActive : sideSubItemIdle}`}
                    >
                      {isZh ? '全部子主题' : 'All subtopics'}
                    </Link>
                    {category.subcategories.map(subcategory => (
                      <Link
                        key={subcategory.slug}
                        href={localizedPath(locale, `/courses/${category.slug}/${subcategory.slug}`)}
                        onClick={event => handleFilterClick(event, category.slug, subcategory.slug)}
                        aria-current={selectedSubcategory === subcategory.slug ? 'true' : undefined}
                        className={`${sideSubItemBase} ${selectedSubcategory === subcategory.slug ? sideSubItemActive : sideSubItemIdle}`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{subcategoryName(subcategory)}</span>
                          <span className="text-xs text-white/40">{subcategory.courses.length}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 space-y-3 lg:hidden">
        <p className="text-xs uppercase tracking-[0.35em] text-white/45">{isZh ? '分类' : 'Category'}</p>
        <div className="relative" ref={pickerRef}>
          <button
            ref={pickerButtonRef}
            type="button"
            onClick={() => setIsPickerOpen(open => !open)}
            aria-expanded={isPickerOpen}
            aria-controls="category-picker"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white transition hover:border-white/30"
          >
            <span className="truncate">
              {activeCategory && activeSubcategory
                ? `${categoryName(activeCategory)} / ${subcategoryName(activeSubcategory)}`
                : activeCategory
                  ? categoryName(activeCategory)
                  : isZh ? '全部课程' : 'All courses'}
            </span>
            <svg className={`h-4 w-4 shrink-0 text-white/50 transition ${isPickerOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.2l3.71-3.97a.75.75 0 111.08 1.04l-4.25 4.55a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {isPickerOpen && (
            <div
              id="category-picker"
              className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
            >
              <Link
                href={localizedPath(locale, '/courses')}
                onClick={event => {
                  handleFilterClick(event, null);
                  setIsPickerOpen(false);
                }}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${!selectedCategory ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <span className="font-semibold">{isZh ? '全部课程' : 'All courses'}</span>
                <span className="text-xs text-white/45">{totalCourses}</span>
              </Link>
              {categories.map(category => (
                <Link
                  key={category.slug}
                  href={localizedPath(locale, `/courses/${category.slug}`)}
                  onClick={event => {
                    handleFilterClick(event, category.slug);
                    setIsPickerOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${selectedCategory === category.slug ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="truncate">{categoryName(category)}</span>
                  <span className="shrink-0 text-xs text-white/45">{category.courses.length}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {activeCategory && activeCategory.subcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={localizedPath(locale, `/courses/${activeCategory.slug}`)}
              onClick={event => handleFilterClick(event, activeCategory.slug)}
              aria-current={!selectedSubcategory ? 'true' : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${!selectedSubcategory ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/60'}`}
            >
              {isZh ? '全部子主题' : 'All subtopics'}
            </Link>
            {activeCategory.subcategories.map(subcategory => (
              <Link
                key={subcategory.slug}
                href={localizedPath(locale, `/courses/${activeCategory.slug}/${subcategory.slug}`)}
                onClick={event => handleFilterClick(event, activeCategory.slug, subcategory.slug)}
                aria-current={selectedSubcategory === subcategory.slug ? 'true' : undefined}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedSubcategory === subcategory.slug ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/60'}`}
              >
                {subcategoryName(subcategory)}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">
              {selectedCategory ? (isZh ? '当前筛选' : 'Filtered') : isZh ? '全部课程' : 'All courses'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{heading}</h2>
            <p className="mt-1 text-sm text-white/55">
              {isZh ? `${courses.length} 门课程` : `${courses.length} courses`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/40">{isZh ? '排序' : 'Sort'}</span>
              {(['difficulty', 'title'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSortChange(mode)}
                  aria-pressed={sortMode === mode}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    sortMode === mode
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 text-white/55 hover:text-white'
                  }`}
                >
                  {mode === 'difficulty' ? (isZh ? '难度优先' : 'By difficulty') : isZh ? '名称' : 'By name'}
                </button>
              ))}
            </div>
          </div>
          {seoPageHref && (
            <Link href={seoPageHref} className="text-sm text-cyan-200 underline underline-offset-4 hover:text-cyan-100">
              {isZh ? '查看该分类的详细介绍 →' : 'Open the category guide →'}
            </Link>
          )}
        </div>

        <ul className="grid min-w-0 gap-3 md:grid-cols-2">
          {visibleCourses.map(course => {
            const level = difficultyLabel(course.difficulty, isZh ? 'zh' : 'en');
            const hours = formatHours(course);
            return (
              <li key={course.id} className="min-w-0">
                <Link
                  href={localizedPath(locale, `/course/${buildDynamicRoutePath(course.path).join('/')}`)}
                  className={itemClass}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white group-hover:text-cyan-200">
                      {course.title}
                    </span>
                    {course.university && (
                      <span className="mt-0.5 block truncate text-xs text-white/45">{course.university}</span>
                    )}
                  </span>
                  <span className={metaClass}>
                    {level && <span className="block">{level}</span>}
                    {hours && <span className="block text-white/35">{hours}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {remaining > 0 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              {isZh ? `显示更多（还有 ${remaining} 门）` : `Show more (${remaining} left)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
