import { useEffect, useRef, useState } from 'react'

/** Счётчик, который «набирает» значение, когда блок появляется в кадре. */
export function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Значение поменяли в админке — начинаем набор заново, а не показываем старое.
    let done = false
    let raf = 0

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    const run = () => {
      if (done) return
      done = true
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
        if (!entry.isIntersecting) return
        io.disconnect()
        run()
      },
      { threshold: 0.4 },
    )

    io.observe(el)

    // Страховка: если наблюдатель не сработал, цифра всё равно окажется на месте.
    const fallback = window.setTimeout(() => {
      io.disconnect()
      if (!done) {
        done = true
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
