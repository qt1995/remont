import { useCallback, useEffect, useRef, useState } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { useReveal } from '@/lib/useReveal'
import { asset } from '@/lib/asset'

type Stage = {
  src: string
  name: string
  caption: string
  price: string
}

const STAGES: Stage[] = [
  {
    src: asset('stages/1-draft.svg'),
    name: 'Черновая',
    caption: 'Стены под штукатурку, стяжка, разводка электрики и сантехники.',
    price: 'от 4 900 ₽/м²',
  },
  {
    src: asset('stages/2-finish.svg'),
    name: 'Чистовая',
    caption: 'Финишная отделка, полы, двери, свет, сантехника. Можно заезжать.',
    price: 'от 9 900 ₽/м²',
  },
  {
    src: asset('stages/3-furnished.svg'),
    name: 'С мебелью',
    caption: 'Подбор, закупка и сборка мебели, света и текстиля под дизайн-проект.',
    price: '+10 000 ₽/м²',
  },
]

const START = 0.25 // ползунок стоит на первой четверти — сразу видно, что картинок две
const MAX_T = STAGES.length - 1

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function StageSlider() {
  const [t, setT] = useState(START)
  const [dragging, setDragging] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ startX: 0, startT: START })
  const { ref: revealRef, visible } = useReveal<HTMLDivElement>(0.35)
  const hinted = useRef(false)
  const touched = useRef(false)

  const phase = t >= MAX_T ? MAX_T - 1 : Math.floor(t)
  const local = clamp(t - phase, 0, 1)
  const from = STAGES[phase]
  const to = STAGES[phase + 1]
  const edge = local * 100

  // Один раз подсказываем, что картинку можно тянуть.
  useEffect(() => {
    if (!visible || hinted.current) return
    hinted.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      if (touched.current) return // пользователь уже сам взялся за ползунок
      const p = (now - start) / 1400
      if (p >= 1) return setT(START)
      setT(START + Math.sin(p * Math.PI) * 0.22)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      touched.current = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      dragState.current = { startX: e.clientX, startT: t }
      setDragging(true)
    },
    [t],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      const width = frameRef.current?.clientWidth ?? 1
      const dx = e.clientX - dragState.current.startX
      setT(clamp(dragState.current.startT + dx / width, 0, MAX_T))
    },
    [dragging],
  )

  const endDrag = useCallback(() => setDragging(false), [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    touched.current = true
    const step = e.shiftKey ? 0.2 : 0.05
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setT((v) => clamp(v - step, 0, MAX_T))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setT((v) => clamp(v + step, 0, MAX_T))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setT(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setT(MAX_T)
    }
  }

  const nearest = Math.round(t)

  return (
    <div ref={revealRef} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
      <div className="rounded-3xl border border-line bg-white p-4 shadow-card md:p-5">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative aspect-[16/10] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-2xl bg-muted select-none"
        >
          <img
            src={from.src}
            alt={'Комната, этап: ' + from.name}
            width={1600}
            height={1000}
            draggable={false}
            className="absolute inset-0 size-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ clipPath: 'inset(0 ' + (100 - edge) + '% 0 0)' }}
          >
            <img
              src={to.src}
              alt={'Комната, этап: ' + to.name}
              width={1600}
              height={1000}
              draggable={false}
              className="size-full object-cover"
            />
          </div>

          {/* подписи сторон */}
          <span
            className="pointer-events-none absolute top-4 left-4 rounded-full bg-navy/85 px-3 py-1.5 font-display text-xs font-medium tracking-wide text-white uppercase backdrop-blur-sm transition-opacity duration-200 md:text-sm"
            style={{ opacity: local > 0.12 ? 1 : 0 }}
          >
            {to.name}
          </span>
          <span
            className="pointer-events-none absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1.5 font-display text-xs font-medium tracking-wide text-navy uppercase backdrop-blur-sm transition-opacity duration-200 md:text-sm"
            style={{ opacity: local < 0.88 ? 1 : 0 }}
          >
            {from.name}
          </span>

          {/* разделитель */}
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(11,18,32,0.25)]"
            style={{ left: edge + '%' }}
          />

          <div
            role="slider"
            tabIndex={0}
            aria-label="Этап ремонта: перетащите, чтобы сравнить"
            aria-valuemin={0}
            aria-valuemax={MAX_T}
            aria-valuenow={Number(t.toFixed(2))}
            aria-valuetext={
              local < 0.5 ? from.name : to.name
            }
            onKeyDown={onKeyDown}
            className="absolute top-1/2 grid size-12 cursor-ew-resize place-items-center rounded-full bg-white text-navy shadow-lift transition-transform duration-150 ease-[var(--ease-out-soft)]"
            style={{
              left: edge + '%',
              transform: 'translate(-50%,-50%) scale(' + (dragging ? 1.08 : 1) + ')',
            }}
          >
            <MoveHorizontal aria-hidden className="size-5" />
          </div>
        </div>

        {/* дорожка с тремя остановками */}
        <div className="mt-5">
          <div className="relative h-1.5 rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gold transition-[width] duration-100"
              style={{ width: (t / MAX_T) * 100 + '%' }}
            />
          </div>
          <div className="mt-3 flex justify-between gap-2">
            {STAGES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => {
                  touched.current = true
                  setT(i)
                }}
                aria-pressed={nearest === i}
                className={
                  'min-h-11 cursor-pointer rounded-lg px-2 text-left font-display text-[13px] font-medium transition-colors duration-200 md:text-sm ' +
                  (nearest === i ? 'text-gold' : 'text-subtle hover:text-navy')
                }
              >
                {i + 1}. {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* расшифровка этапов */}
      <div className="flex flex-col gap-3">
        {STAGES.map((s, i) => {
          const active = nearest === i
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => setT(i)}
              className={
                'cursor-pointer rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] duration-200 ' +
                (active
                  ? 'border-gold bg-gold-100 shadow-card'
                  : 'border-line bg-white hover:border-navy/30 hover:shadow-card')
              }
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2 font-display text-base font-semibold">
                  <span
                    aria-hidden
                    className={
                      'inline-block size-2 shrink-0 translate-y-[-1px] rounded-full transition-colors ' +
                      (active ? 'bg-gold' : 'bg-line')
                    }
                  />
                  {s.name}
                </span>
                <span className="tnum shrink-0 font-display text-sm font-medium text-gold">
                  {s.price}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-subtle">{s.caption}</p>
            </button>
          )
        })}
        <p className="mt-1 text-sm text-subtle">
          Цены за м² указаны для Тюмени и включают только работы. Точную сумму считаем после замера.
        </p>
      </div>
    </div>
  )
}
