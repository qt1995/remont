import { useId, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export function AccordionItem({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="group border-b border-line last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-start justify-between gap-5 py-6 text-left"
        >
          <span className="flex-1">
            <span
              className={
                'block font-display text-[17px] leading-snug font-medium transition-colors duration-200 md:text-[19px] ' +
                (open ? 'text-gold' : 'group-hover:text-navy-700')
              }
            >
              {title}
            </span>
            {subtitle && <span className="mt-1 block text-sm text-subtle">{subtitle}</span>}
          </span>
          <span
            aria-hidden
            className={
              'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-300 ease-[var(--ease-out-soft)] ' +
              (open
                ? 'rotate-45 border-gold bg-gold text-white'
                : 'border-line text-subtle group-hover:border-navy/40 group-hover:text-navy')
            }
          >
            <Plus className="size-4" />
          </span>
        </button>
      </h3>

      <div
        className={
          'grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-soft)] ' +
          (open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')
        }
      >
        <div className="overflow-hidden">
          <div
            id={id}
            className="max-w-[68ch] pr-4 pb-6 text-[15px] leading-relaxed text-navy-700 md:text-base"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
