type Option<T extends string> = { id: T; label: string; sub?: string }

type Props<T extends string> = {
  options: readonly Option<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: Props<T>) {
  const hasSub = options.some((o) => o.sub)

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={
        'flex w-full flex-wrap gap-1.5 rounded-2xl border border-line bg-white p-1.5 md:inline-flex md:w-auto ' +
        className
      }
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={
              'flex-1 cursor-pointer rounded-xl text-center font-display font-medium transition-[background-color,color,box-shadow] duration-200 md:flex-none ' +
              (size === 'sm'
                ? 'min-h-11 basis-[120px] px-5 text-sm'
                : 'min-h-12 basis-[150px] px-7 text-[15px]') +
              (hasSub ? ' py-2.5' : '') +
              (active
                ? ' bg-navy text-white shadow-[0_6px_18px_-10px_rgba(15,23,42,0.9)]'
                : ' text-navy-700 hover:bg-sand')
            }
          >
            <span className="block whitespace-nowrap">{o.label}</span>
            {o.sub && (
              <span
                className={
                  'mt-0.5 block text-[12px] font-normal ' + (active ? 'text-white/60' : 'text-subtle')
                }
              >
                {o.sub}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
