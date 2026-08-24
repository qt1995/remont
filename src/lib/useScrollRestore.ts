import { useEffect } from 'react'

const KEY = 'remont:scroll'

/**
 * Возвращает посетителя туда, где он был до перезагрузки.
 *
 * Своими силами, потому что штатное восстановление браузера здесь не работает:
 * секции появляются с анимацией, а контент подгружается с сервера — к моменту
 * восстановления страница ещё короткая.
 */
export function useScrollRestore(ready: boolean) {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

    let timer = 0
    const onScroll = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        try {
          sessionStorage.setItem(KEY, String(window.scrollY))
        } catch {
          /* приватный режим */
        }
      }, 150)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    // Если человек пришёл по якорю — уважаем якорь, а не сохранённую позицию
    if (window.location.hash) return

    let saved = 0
    try {
      saved = Number(sessionStorage.getItem(KEY) || 0)
    } catch {
      return
    }
    if (saved < 200) return

    // Ждём, пока страница дорастёт до нужной высоты: секции появляются постепенно
    let tries = 0
    const tick = () => {
      if (document.body.scrollHeight >= saved + window.innerHeight || tries > 20) {
        window.scrollTo({ top: saved, behavior: 'auto' })
        return
      }
      tries += 1
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [ready])
}
