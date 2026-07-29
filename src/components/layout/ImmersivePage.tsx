import { ReactNode, HTMLAttributes } from 'react'

interface ImmersivePageProps {
  children: ReactNode
  className?: string
  contentClassName?: string
  gradient?: string
}

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #020617 0%, #070f22 45%, #0b162f 100%)'

export function ImmersivePage({
  children,
  className = '',
  contentClassName = 'relative z-10',
  gradient = DEFAULT_GRADIENT
}: ImmersivePageProps) {
  return (
    <main className={`relative flex-grow overflow-clip ${className}`}>
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0" style={{ background: gradient }}></div>
        <div className="absolute -top-1/3 left-1/4 w-[60vw] h-[60vw] bg-slate-700/30 blur-[200px]"></div>
        <div className="absolute bottom-[-15%] left-1/5 w-[70vw] h-[50vw] bg-cyan-500/12 blur-[220px]"></div>
      </div>

      <div className={contentClassName}>
        {children}
      </div>
    </main>
  )
}

interface ImmersiveSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  className?: string
}

export function ImmersiveSection({ children, className = '', ...rest }: ImmersiveSectionProps) {
  return (
    <section {...rest} className={`relative ${className}`}>
      {children}
    </section>
  )
}
