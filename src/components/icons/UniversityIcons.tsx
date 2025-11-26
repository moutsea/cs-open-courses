import { ReactNode } from "react"

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
    className={["h-11 w-11 text-white", className].filter(Boolean).join(" ")}
  >
    {children}
  </svg>
)

export function ShieldIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6z" />
    </IconWrapper>
  )
}

export function TargetIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </IconWrapper>
  )
}

export function BridgeIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M3 12h18" />
      <path d="M5 12v4" />
      <path d="M19 12v4" />
      <path d="M3 16c3-3 15-3 18 0" />
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

export function FlaskIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M6 3h12" />
      <path d="M9 3v7l-3 6a4 4 0 003.5 6h6a4 4 0 003.5-6l-3-6V3" />
    </IconWrapper>
  )
}

export function AtomIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <circle cx="12" cy="12" r="2" />
      <path d="M19 6c-4 3-10 3-14 0" />
      <path d="M19 18c-4-3-10-3-14 0" />
      <path d="M6 6c3 4 3 10 0 14" />
      <path d="M18 6c-3 4-3 10 0 14" />
    </IconWrapper>
  )
}

export function LeafIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M5 12c3 1 6 0 9-2s5-5 5-8c-3 0-6 2-9 4S5 10 5 12z" />
      <path d="M5 12c0 5 5 9 9 9 2 0 4-1 5-2" />
    </IconWrapper>
  )
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <IconWrapper className={className}>
      <path d="M4 21h16" />
      <path d="M6 21V7l6-4 6 4v14" />
      <path d="M10 21v-6h4v6" />
    </IconWrapper>
  )
}
