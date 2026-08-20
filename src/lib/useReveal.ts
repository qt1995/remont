import { useEffect, useRef, useState } from 'react'

/**
 * Появление секции при скролле. Уважает prefers-reduced-motion.
 * Страховка: если IntersectionObserver по какой-то причине не сработал
 * (вкладка не отрисовывается, старый браузер), контент всё равно показывается —
 * пустая страница хуже, чем анимация, которая не проигралась.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    )

    io.observe(el)

    const fallback = window.setTimeout(() => {
      setVisible(true)
      io.disconnect()
    }, 2500)

    return () => {
      io.disconnect()
      clearTimeout(fallback)
    }
  }, [threshold])

  return { ref, visible }
}
