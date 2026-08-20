import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Палитра проверена валидатором dataviz (светлый фон): все четыре цвета
 * в полосе светлоты, с достаточной цветностью, различимы при дальтонизме
 * и дают контраст к фону выше 3:1.
 */
export const SERIES = {
  blue: '#2563eb',
  amber: '#b45309',
  teal: '#0d9488',
  rose: '#be123c',
} as const

const GRID = '#e2e8f0'
const AXIS_INK = '#64748b'

const nf = new Intl.NumberFormat('ru-RU')
export const fmt = (n: number) => nf.format(Math.round(n))

/* ─────────────────────────  Плитка с числом  ───────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  accent = SERIES.blue,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span aria-hidden className="size-2.5 rounded-full" style={{ background: accent }} />
        <p className="text-[13px] text-subtle">{label}</p>
      </div>
      <p className="tnum mt-2 font-display text-[30px] leading-none font-semibold">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-subtle">{hint}</p>}
    </div>
  )
}

/* ─────────────────────────  Динамика по дням  ───────────────────────── */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  return { ref, width }
}

const niceMax = (v: number) => {
  if (v <= 5) return 5
  const pow = 10 ** Math.floor(Math.log10(v))
  return Math.ceil(v / (pow / 2)) * (pow / 2)
}

const shortDay = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export type Point = { day: string; value: number }

export function TimeSeries({
  data,
  color = SERIES.blue,
  kind = 'area',
  height = 170,
  valueLabel,
}: {
  data: Point[]
  color?: string
  kind?: 'area' | 'bars'
  height?: number
  valueLabel: string
}) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const padL = 38
  const padR = 8
  const padT = 10
  const padB = 22
  const w = Math.max(width, 260)
  const innerW = w - padL - padR
  const innerH = height - padT - padB

  const max = niceMax(Math.max(1, ...data.map((d) => d.value)))
  const x = (i: number) =>
    padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => padT + innerH - (v / max) * innerH

  const ticks = [0, max / 2, max]

  const line = data.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d.value).toFixed(1)).join(' ')
  const area =
    data.length > 1
      ? line + ` L${x(data.length - 1).toFixed(1)} ${padT + innerH} L${x(0).toFixed(1)} ${padT + innerH} Z`
      : ''

  const barW = data.length ? Math.max(3, Math.min(22, (innerW / data.length) * 0.65)) : 6
  const active = hover !== null ? data[hover] : null

  return (
    <div ref={ref} className="relative">
      <svg
        width={w}
        height={height}
        role="img"
        aria-label={valueLabel + ' по дням'}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - rect.left
          if (data.length < 2) return setHover(data.length ? 0 : null)
          const i = Math.round(((px - padL) / innerW) * (data.length - 1))
          setHover(Math.max(0, Math.min(data.length - 1, i)))
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text
              x={padL - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill={AXIS_INK}
              fontVariant="tabular-nums"
            >
              {fmt(t)}
            </text>
          </g>
        ))}

        {kind === 'area' ? (
          <>
            {area && <path d={area} fill={color} opacity="0.12" />}
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          </>
        ) : (
          data.map((d, i) => (
            <rect
              key={d.day}
              x={x(i) - barW / 2}
              y={y(d.value)}
              width={barW}
              height={Math.max(d.value > 0 ? 2 : 0, padT + innerH - y(d.value))}
              rx="3"
              fill={color}
              opacity={hover === null || hover === i ? 1 : 0.45}
            />
          ))
        )}

        {active && (
          <>
            <line
              x1={x(hover!)}
              x2={x(hover!)}
              y1={padT}
              y2={padT + innerH}
              stroke={AXIS_INK}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {kind === 'area' && (
              <circle cx={x(hover!)} cy={y(active.value)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
            )}
          </>
        )}

        {data.length > 0 && (
          <>
            <text x={padL} y={height - 6} fontSize="11" fill={AXIS_INK}>
              {shortDay(data[0].day)}
            </text>
            <text x={w - padR} y={height - 6} fontSize="11" fill={AXIS_INK} textAnchor="end">
              {shortDay(data[data.length - 1].day)}
            </text>
          </>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] shadow-pop"
          style={{ left: Math.min(Math.max(x(hover!), 60), w - 60), top: 0 }}
        >
          <span className="block text-subtle">{shortDay(active.day)}</span>
          <span className="tnum font-display font-semibold">
            {fmt(active.value)} — {valueLabel}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────  Горизонтальные бары  ───────────────────────── */

export function BarList({
  items,
  color = SERIES.teal,
  empty = 'Пока нет данных',
}: {
  items: { name: string; count: number }[]
  color?: string
  empty?: string
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-subtle">{empty}</p>

  const max = Math.max(...items.map((i) => i.count), 1)

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i) => (
        <li key={i.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px] text-navy-700" title={i.name}>
            {i.name}
          </span>
          <span className="tnum font-display text-[13px] font-semibold">{fmt(i.count)}</span>
          <span className="col-span-2 block h-2 rounded-full bg-sand">
            <span
              className="block h-2 rounded-full"
              style={{ width: Math.max(3, (i.count / max) * 100) + '%', background: color }}
            />
          </span>
        </li>
      ))}
    </ul>
  )
}
