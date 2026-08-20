import { useEffect, useRef, useState } from 'react'

/** Счётчик, который «набирает» значение, когда блок появляется в кадре. */
export function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    let raf = 0

    const run = () => {
      if (done.current) return
      done.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        // ease-out: быстро в начале, мягко в конце
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return
        io.disconnect()
        run()
      },
      { threshold: 0.4 },
    )

    io.observe(el)

    // Страховка: если наблюдатель не сработал, цифра всё равно окажется на месте.
    const fallback = window.setTimeout(() => {
      io.disconnect()
      if (!done.current) {
        done.current = true
        setValue(to)
      }
    }, 2500)

    return () => {
      io.disconnect()
      clearTimeout(fallback)
      cancelAnimationFrame(raf)
    }
  }, [to, duration])

  return <span ref={ref}>{value}</span>
}
