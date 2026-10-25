interface BrandMarkProps {
  size?: number
  className?: string
  title?: string
}

export default function BrandMark({ size = 40, className, title = 'CS61B & Beyond' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
    >
      <rect x="1" y="1" width="62" height="62" rx="18" fill="#06B6D4" />
      <g fill="none" stroke="#0B1220" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 15.5V48.5" />
        <path d="M24 15.5h8.5a9.2 9.2 0 0 1 0 18.4H24" />
        <path d="M24 33.9h10a9.2 9.2 0 0 1 0 14.6H24" />
      </g>
    </svg>
  )
}
