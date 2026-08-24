import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { AlertTriangle, Check, Loader2, X } from 'lucide-react'

/* ─────────────────────────  Кнопка  ───────────────────────── */

type Variant = 'primary' | 'dark' | 'ghost' | 'danger' | 'outline'

const variants: Record<Variant, string> = {
  primary: 'bg-gold text-white hover:bg-gold-600',
  dark: 'bg-navy text-white hover:bg-navy-700',
  outline: 'border border-line bg-white text-navy hover:bg-sand',
  ghost: 'text-navy-600 hover:bg-sand',
  danger: 'border border-bad/30 bg-bad-bg text-bad hover:bg-bad hover:text-white',
}

export function Button({
  variant = 'outline',
  loading = false,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
}) {
  return (
    <button
      className={
        'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 ' +
        'font-display text-sm font-medium transition-colors duration-150 ' +
        'disabled:pointer-events-none disabled:opacity-50 ' +
        variants[variant] +
        ' ' +
        className
      }
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

/* ─────────────────────────  Поля  ───────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={'block ' + className}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-navy-700">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] text-bad">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[12px] text-subtle">{hint}</span>
      )}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm"
    >
      <span
        className={
          'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ' +
          (checked ? 'bg-gold' : 'bg-line')
        }
      >
        <span
          className={
            'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-[left] duration-200 ' +
            (checked ? 'left-[1.125rem]' : 'left-0.5')
          }
        />
      </span>
      <span className="text-navy-700">{label}</span>
    </button>
  )
}

/* ─────────────────────────  Карточка и заголовки  ───────────────────────── */

export function Card({
  title,
  actions,
  children,
  className = '',
  padded = true,
}: {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={'rounded-xl border border-line bg-card shadow-card ' + className}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-display text-[15px] font-semibold">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-subtle">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'new' | 'work' | 'ok' | 'bad'
  children: ReactNode
}) {
  const tones = {
    neutral: 'bg-sand text-navy-600',
    new: 'bg-gold-100 text-gold',
    work: 'bg-warn-bg text-warn',
    ok: 'bg-ok-bg text-ok',
    bad: 'bg-bad-bg text-bad',
  }
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2.5 py-1 font-display text-[12px] font-medium ' +
        tones[tone]
      }
    >
      {children}
    </span>
  )
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <p className="font-display text-[15px] font-medium">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-md text-sm text-subtle">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Spinner({ label = 'Загружаем…' }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 py-10 text-sm text-subtle">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </p>
  )
}

/* ─────────────────────────  Уведомления  ───────────────────────── */

type Toast = { id: number; text: string; tone: 'ok' | 'bad' }
const ToastCtx = createContext<{ notify: (text: string, tone?: 'ok' | 'bad') => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const seq = useRef(0)

  const notify = useCallback((text: string, tone: 'ok' | 'bad' = 'ok') => {
    const id = ++seq.current
    setItems((v) => [...v, { id, text, tone }])
    setTimeout(() => setItems((v) => v.filter((t) => t.id !== id)), 4000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-[min(92vw,380px)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-pop ' +
              'motion-safe:animate-[toast-in_.25s_var(--ease-out-soft)] ' +
              (t.tone === 'ok'
                ? 'border-ok/20 bg-ok-bg text-ok'
                : 'border-bad/20 bg-bad-bg text-bad')
            }
          >
            {t.tone === 'ok' ? (
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <span className="flex-1">{t.text}</span>
            <button
              type="button"
              onClick={() => setItems((v) => v.filter((x) => x.id !== t.id))}
              aria-label="Закрыть"
              className="cursor-pointer opacity-60 hover:opacity-100"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast вне ToastProvider')
  return ctx
}

/* ─────────────────────────  Модалка и подтверждение  ───────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-90 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 py-10 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          'w-full rounded-2xl bg-white shadow-pop ' + (wide ? 'max-w-4xl' : 'max-w-xl')
        }
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="grid size-9 cursor-pointer place-items-center rounded-lg text-subtle hover:bg-sand hover:text-navy"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

type ConfirmOptions = {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'dark'
}

type ConfirmState = ConfirmOptions & { text: string; resolve: (v: boolean) => void }

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback(
    (text: string, options: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => setState({ text, resolve, ...options })),
    [],
  )

  const done = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }

  const dialog = (
    <Modal open={!!state} onClose={() => done(false)} title={state?.title ?? 'Подтвердите действие'}>
      <p className="text-[15px]">{state?.text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={() => done(false)}>{state?.cancelLabel ?? 'Отмена'}</Button>
        <Button variant={state?.tone ?? 'danger'} onClick={() => done(true)}>
          {state?.confirmLabel ?? 'Удалить'}
        </Button>
      </div>
    </Modal>
  )

  return { confirm, dialog }
}
