import type { ReactNode } from 'react'
import { useReveal } from '@/lib/useReveal'

type Tone = 'paper' | 'sand' | 'navy'

type Props = {
  id?: string
  eyebrow?: string
  title?: ReactNode
  lead?: ReactNode
  tone?: Tone
  className?: string
  headerAside?: ReactNode
  /** Убирает фактуру-сетку, если секция и так плотная. */
  plain?: boolean
  children: ReactNode
}

const tones: Record<Tone, string> = {
  paper: 'bg-paper text-ink',
  sand: 'bg-sand text-ink',
  navy: 'bg-navy text-white',
}

export function Eyebrow({ children, tone = 'paper' }: { children: ReactNode; tone?: Tone }) {
  return (
    <p
      className={
        'mb-4 flex items-center gap-3 font-display text-xs font-medium tracking-[0.2em] uppercase ' +
        (tone === 'navy' ? 'text-gold-300' : 'text-gold')
      }
    >
      <span aria-hidden className="h-px w-8 bg-current opacity-60" />
      {children}
    </p>
  )
}

export function Section({
  id,
  eyebrow,
  title,
  lead,
  tone = 'paper',
  className = '',
  headerAside,
  plain = false,
  children,
}: Props) {
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section
      id={id}
      ref={ref}
      className={
        'relative overflow-hidden py-18 md:py-26 ' +
        tones[tone] +
        ' ' +
        className +
        ' transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)] ' +
        (visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')
      }
    >
      {!plain && (
        <div
          aria-hidden
          className={
            'pointer-events-none absolute inset-0 mask-fade-y ' +
            (tone === 'navy' ? 'bg-blueprint-dark' : 'bg-blueprint')
          }
        />
      )}

      <div className="container-page relative">
        {(eyebrow || title || lead) && (
          <header className="mb-12 flex flex-col gap-7 md:mb-16 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
              {title && (
                <h2 className="text-[30px] leading-[1.08] font-semibold md:text-[44px]">{title}</h2>
              )}
              {lead && (
                <p
                  className={
                    'mt-5 text-[17px] leading-relaxed md:text-lg ' +
                    (tone === 'navy' ? 'text-white/70' : 'text-subtle')
                  }
                >
                  {lead}
                </p>
              )}
            </div>
            {headerAside && <div className="shrink-0">{headerAside}</div>}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
