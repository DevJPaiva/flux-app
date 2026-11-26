import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight, Bell, Calendar, Camera, Car, Check, ChevronRight, CreditCard,
  Eye, EyeOff, FileText, Home, Monitor, Moon, Pencil, Plus, Repeat, Send,
  ShoppingBag, SlidersHorizontal, Sparkles, Sun, Target, Trash2, Upload, Wallet, X,
  type LucideIcon,
} from 'lucide-react'
import type { IconName } from './finance'

const LUCIDE_ICONS: Record<IconName, LucideIcon> = {
  plus: Plus,
  card: CreditCard,
  target: Target,
  file: FileText,
  eye: Eye,
  eyeOff: EyeOff,
  home: Home,
  arrow: ArrowRight,
  close: X,
  market: ShoppingBag,
  repeat: Repeat,
  car: Car,
  wallet: Wallet,
  spark: Sparkles,
  trash: Trash2,
  edit: Pencil,
  chevron: ChevronRight,
  send: Send,
  camera: Camera,
  upload: Upload,
  calendar: Calendar,
  check: Check,
  moon: Moon,
  sun: Sun,
  monitor: Monitor,
  bell: Bell,
  tune: SlidersHorizontal,
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const LucideComponent = LUCIDE_ICONS[name]
  return <LucideComponent size={size} strokeWidth={1.75} aria-hidden="true" />
}
export function Brand({ showMark = true }: { showMark?: boolean }) { return <span className="brand-mark">{showMark && <i aria-hidden="true" />}flux</span> }
export function Avatar({ name, src, alt = '' }: { name?: string; src?: string; alt?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])
  if (src && !failed) return <img src={src} alt={alt} onError={() => setFailed(true)} />
  const initial = (name || '').trim().charAt(0).toUpperCase() || 'F'
  return <span className="avatar-initial" aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>{initial}</span>
}
export function SplashScreen({ message = 'Preparando seu espaço Flux…' }: { message?: string }) {
  return <div className="splash-screen" role="status" aria-live="polite">
    <div className="splash-content">
      <div className="splash-badge"><Brand /></div>
      <div className="splash-bar" aria-hidden="true"><span /></div>
      <p>{message}</p>
    </div>
  </div>
}
export function AccessTransition() {
  return (
    <div className="access-transition" aria-hidden="true">
      <div className="access-transition-aura" />
      <div className="access-transition-mark">
        <Brand />
      </div>
    </div>
  )
}
export function PageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Voltar"><Icon name="arrow" /></button><h1 tabIndex={-1}>{title}</h1>{action ?? <span />}</header>
}
export function Progress({ value, tone = 'lime', label = 'Progresso' }: { value: number; tone?: string; label?: string }) {
  return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={Math.min(100, Math.max(0, value))} aria-valuemin={0} aria-valuemax={100}><span className={tone} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
}
export function Empty({ icon = 'wallet', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="row-icon"><Icon name={icon} size={25} /></span><h3>{title}</h3>{children}</div>
}
export function SuccessState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  icon = 'check',
}: {
  title: string
  description: ReactNode
  actionLabel: string
  onAction: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  icon?: IconName
}) {
  return (
    <div className="auth-confirmation" role="status" aria-live="polite">
      <span className="auth-confirmation-icon"><Icon name={icon} size={22} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="success-state-actions">
        <button type="button" className="primary-button" onClick={onAction}>
          {actionLabel}
          <Icon name="arrow" size={18} />
        </button>
        {secondaryLabel && onSecondary && (
          <button type="button" className="secondary-button" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}
export type ToastTone = 'success' | 'error'
export function Toast({ message, tone = 'success', onClose }: { message: string; tone?: ToastTone; onClose?: () => void }) {
  return (
    <div className={`toast toast--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        <Icon name={tone === 'error' ? 'close' : 'check'} size={15} />
      </span>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button type="button" className="toast-close" onClick={onClose} aria-label="Fechar aviso">
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
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
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}><section ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div className="sheet-handle" /><div className="sheet-header"><h2 id="sheet-title">{title}</h2><button onClick={close} aria-label="Fechar"><Icon name="close" /></button></div>{children}</section></div>,
    document.body,
  )
}
