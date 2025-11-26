import { ReactNode } from 'react'

type IconProps = {
  className?: string
}

const IconWrapper = ({ children, className }: { children: ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={['h-10 w-10', className].filter(Boolean).join(' ')}
  >
    {children}
  </svg>
)

export function ToolsIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M4 20l9-9" />
      <circle cx="9" cy="6" r="2.5" />
      <path d="M15 4l6 6" />
      <path d="M20 14l-4 4" />
      <path d="M3 15l6 6" />
    </IconWrapper>
  )
}

export function MathIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M4 4v16" />
      <path d="M4 20h16" />
      <path d="M4 14l4-6 4 3 4-5 4 4" />
    </IconWrapper>
  )
}

export function CodeIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <rect x="5" y="6" width="14" height="10" rx="2" />
      <path d="M2 18h20" />
    </IconWrapper>
  )
}

export function SystemsIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <rect x="8" y="8" width="8" height="8" rx="2" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M5 5v3" />
      <path d="M19 16v3" />
    </IconWrapper>
  )
}

export function TheoryIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="17" r="2.2" />
      <path d="M7.8 8.6l8.4 6.8" />
      <path d="M16.2 6.4l-8.4 6.8" />
      <path d="M6 9v8" />
      <path d="M18 7v8" />
    </IconWrapper>
  )
}

export function AiIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M12 5c-3 0-5 2.2-5 5v4c0 2.8 2 5 5 5s5-2.2 5-5v-4c0-2.8-2-5-5-5z" />
      <path d="M12 5v14" />
      <path d="M7 10h10" />
      <path d="M7 14h10" />
      <path d="M9 5V3" />
      <path d="M15 5V3" />
      <path d="M9 21v-2" />
      <path d="M15 21v-2" />
    </IconWrapper>
  )
}

export function RocketIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M6 22l2-6 4-4 6-2-2 6-4 4-6 2z" />
      <path d="M12 8l4 4" />
      <path d="M14 2l4 4" />
      <path d="M8 16l4 4" />
      <circle cx="15" cy="9" r="1.5" />
    </IconWrapper>
  )
}

export function TargetIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 3v3" />
      <path d="M21 12h-3" />
    </IconWrapper>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M4 5h10a4 4 0 014 4v10H8a4 4 0 00-4 4z" />
      <path d="M4 5v14a4 4 0 014-4h10V5a4 4 0 00-4-4H4z" />
    </IconWrapper>
  )
}
