'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const promotions = [
  {
    name: 'GPTHubs',
    text: {
      zh: '想要使用 GPT / Codex 辅助学习吗？',
      en: 'Want to learn with GPT / Codex?',
    },
    href: 'https://gpthubs.net',
    chineseOnly: true,
  },
  {
    name: 'KimiSeek',
    text: {
      zh: 'DeepSeek/GLM/Kimi/Qwen 开源模型 5 折起',
      en: 'DeepSeek, GLM, Kimi & Qwen open-source models — up to 50% off.',
    },
    href: 'https://kimiseek.app',
    chineseOnly: false,
  },
  {
    name: 'WeChatAI',
    text: {
      zh: '把前沿 AI 接进微信',
      en: 'Bring cutting-edge AI to WeChat.',
    },
    href: 'https://wechatai.app',
    chineseOnly: true,
  },
  {
    name: 'CodeByAI',
    text: {
      zh: 'Claude/GPT/Gemini 多种渠道，一个 apikey 接入',
      en: 'Claude, GPT & Gemini across multiple providers — one API key.',
    },
    href: 'https://codebyai.net',
    chineseOnly: false,
  },
];

const internationalPromotions = promotions.filter(item => !item.chineseOnly);
const controlClass = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-200';

export default function CoursePromotions({ locale }: { locale: string }) {
  const isChinese = locale === 'zh';
  const items = isChinese ? promotions : internationalPromotions;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(preference.matches);
    setIsPaused(preference.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      if (event.matches) setIsPaused(true);
    };
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  const showSlide = useCallback((index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      left: index * viewport.clientWidth,
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  }, [reducedMotion]);

  useEffect(() => {
    if (isPaused || isHovered || isFocusPaused) return;

    const timer = window.setInterval(() => {
      const viewport = viewportRef.current;
      if (!viewport || document.hidden) return;
      const bounds = viewport.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      showSlide((activeIndex + 1) % items.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [activeIndex, isPaused, isHovered, isFocusPaused, items.length, showSlide]);

  const changeSlide = (direction: number) => {
    setIsPaused(true);
    showSlide((activeIndex + direction + items.length) % items.length);
  };

  return (
    <aside
      aria-label={isChinese ? 'AI 学习工具' : 'AI learning tools'}
      aria-roledescription={isChinese ? '轮播' : 'carousel'}
      className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/5 text-sm"
      onPointerEnter={event => {
        if (event.pointerType !== 'touch') setIsHovered(true);
      }}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusPaused(false);
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div
          ref={viewportRef}
          tabIndex={0}
          aria-label={isChinese ? '左右滑动查看更多' : 'Scroll horizontally for more'}
          aria-live="off"
          className="flex min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-200"
          onScroll={event => {
            const { scrollLeft, clientWidth } = event.currentTarget;
            if (clientWidth > 0) {
              setActiveIndex(Math.max(0, Math.min(items.length - 1, Math.round(scrollLeft / clientWidth))));
            }
          }}
          onPointerDown={() => setIsPaused(true)}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              // Keep focus out of the link that is about to slide offscreen.
              event.currentTarget.focus({ preventScroll: true });
              changeSlide(event.key === 'ArrowRight' ? 1 : -1);
            }
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.href}
              role="group"
              aria-roledescription={isChinese ? '轮播项' : 'slide'}
              aria-label={`${index + 1} / ${items.length}`}
              aria-hidden={index !== activeIndex}
              className="flex min-w-0 basis-full shrink-0 snap-center flex-col justify-between gap-x-5 px-4 py-2 sm:flex-row sm:items-center"
            >
              <p className="py-1 leading-6 text-slate-200 [overflow-wrap:anywhere]">{item.text[isChinese ? 'zh' : 'en']}</p>
              <a
                href={item.href}
                target="_blank"
                rel="sponsored noopener noreferrer"
                tabIndex={index === activeIndex ? 0 : -1}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 transition hover:text-cyan-100 hover:decoration-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 sm:self-center"
              >
                {`${isChinese ? '了解' : 'Explore'} ${item.name}`}
                <span aria-hidden="true">↗</span>
                <span className="sr-only">{isChinese ? '（在新标签页打开）' : ' (opens in a new tab)'}</span>
              </a>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-cyan-300/10 px-2 sm:border-t-0 sm:border-l">
          <button
            type="button"
            onClick={() => changeSlide(-1)}
            aria-label={isChinese ? '上一条' : 'Previous item'}
            className={controlClass}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-9 text-center text-xs tabular-nums text-white/50" aria-hidden="true">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={() => changeSlide(1)}
            aria-label={isChinese ? '下一条' : 'Next item'}
            className={controlClass}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPaused(paused => !paused);
              // An explicit play action can resume rotation while this button has focus.
              if (isPaused) setIsFocusPaused(false);
            }}
            aria-label={isPaused
              ? (isChinese ? '开始自动轮播' : 'Start automatic rotation')
              : (isChinese ? '暂停自动轮播' : 'Pause automatic rotation')}
            className={controlClass}
          >
            {isPaused
              ? <Play className="h-3.5 w-3.5" aria-hidden="true" />
              : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
