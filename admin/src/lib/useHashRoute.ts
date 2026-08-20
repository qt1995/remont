import { useEffect, useState } from 'react'

/**
 * Маршрутизация по хешу — админка лежит на /admin и раздаётся статикой,
 * так что не нужен ни серверный фолбэк, ни отдельная библиотека.
 */
export function useHashRoute(fallback = 'dashboard') {
  const read = () => window.location.hash.replace(/^#\/?/, '') || fallback
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const navigate = (to: string) => {
    window.location.hash = '/' + to
  }

  return { route, navigate }
}
