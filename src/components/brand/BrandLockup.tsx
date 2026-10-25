import BrandMark from './BrandMark'

interface BrandLockupProps {
  size?: number
  subtitle?: string
  variant?: 'header' | 'footer'
}

/** Mark + wordmark. "& Beyond" is the single accent, everything else is plain white. */
export default function BrandLockup({ size = 40, subtitle, variant = 'header' }: BrandLockupProps) {
  const wordmarkSize = variant === 'footer' ? 'text-[20px]' : 'text-[18px]'
  const subtitleSize = variant === 'footer' ? 'text-[10.5px]' : 'text-[10px]'

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <BrandMark size={size} className="shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span className={`${wordmarkSize} font-semibold leading-none tracking-tight text-white`}>
          CS61B <span className="font-semibold text-cyan-300">&amp; Beyond</span>
        </span>
        {subtitle ? (
          <span className={`mt-1.5 ${subtitleSize} truncate font-medium tracking-[0.06em] text-white/45`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )
}
