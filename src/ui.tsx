import { useEffect, useRef, type ReactNode } from 'react'
import type { IconName } from './finance'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    card: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="m14 10 5-5" /></>,
    file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.1 2.9M6.6 6.6C3.5 8.4 2 12 2 12s3.5 6 10 6c1.2 0 2.3-.2 3.3-.5" /></>,
    home: <path d="m3 11 9-8 9 8v9H7v-6h10v6" />,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    market: <><path d="M4 9h16l-2 11H6L4 9Z" /><path d="m8 9 4-6 4 6M9 13v3M15 13v3" /></>,
    repeat: <path d="M17 2l3 3-3 3M20 5h-9a6 6 0 0 0-6 6M7 22l-3-3 3-3M4 19h9a6 6 0 0 0 6-6" />,
    car: <><path d="m5 11 2-5h10l2 5M4 11h16v7H4z" /><path d="M7 18v2M17 18v2M7 14h.01M17 14h.01" /></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" /><path d="M16 12h5" /></>,
    spark: <path d="m12 2 1.5 5.1L18 10l-4.5 2.9L12 18l-1.5-5.1L6 10l4.5-2.9L12 2Z" />,
    trash: <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />,
    edit: <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20ZM13 7l3.5 3.5" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    send: <path d="m3 11 18-8-8 18-2-8-8-2ZM11 13l5-5" />,
    camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4z" /><circle cx="12" cy="13" r="4" /></>,
    upload: <path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    moon: <path d="M20.8 13.1A9 9 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M12 17v4M8 21h8" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
export function Brand({ showMark = true }: { showMark?: boolean }) { return <span className="brand-mark">{showMark && <i aria-hidden="true" />}flux</span> }
export function PageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Voltar"><Icon name="arrow" /></button><h1 tabIndex={-1}>{title}</h1>{action ?? <span />}</header>
}
export function Progress({ value, tone = 'lime', label = 'Progresso' }: { value: number; tone?: string; label?: string }) {
  return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={Math.min(100, Math.max(0, value))} aria-valuemin={0} aria-valuemax={100}><span className={tone} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
}
export function Empty({ icon = 'wallet', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="row-icon"><Icon name={icon} size={25} /></span><h3>{title}</h3>{children}</div>
}
export function Sheet({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const nodes = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [])
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}><section ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div className="sheet-handle" /><div className="sheet-header"><h2 id="sheet-title">{title}</h2><button onClick={close} aria-label="Fechar"><Icon name="close" /></button></div>{children}</section></div>
}
