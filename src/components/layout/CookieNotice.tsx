import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useContent, docUrl } from '@/lib/content'

const KEY = 'remont:cookie-ok'

/**
 * Уведомление о файлах cookie.
 *
 * Не блокирует сайт: Роскомнадзор требует информировать об использовании
 * cookie и дать ссылку на политику, а не выпрашивать согласие модалкой.
 */
export function CookieNotice() {
  const { settings } = useContent()
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (!settings.cookieNotice) return
    try {
      setHidden(localStorage.getItem(KEY) === '1')
    } catch {
      setHidden(false)
    }
  }, [settings.cookieNotice])

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* приватный режим — просто скроем на этот визит */
    }
    setHidden(true)
  }

  if (!settings.cookieNotice || hidden) return null

  return (
    <div
      role="region"
      aria-label="Уведомление о файлах cookie"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-line bg-white/97 p-4 shadow-lift backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-[14px] leading-relaxed text-navy-700">
          Сайт использует файлы cookie и собирает обезличенную статистику посещений — так мы
          понимаем, какие разделы полезны. Подробности в{' '}
          <a
            href={docUrl('/privacy')}
            className="text-gold underline underline-offset-2 hover:text-gold-600"
          >
            политике обработки персональных данных
          </a>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy px-5 font-display text-[15px] font-medium text-white transition-colors hover:bg-navy-700"
        >
          Понятно
          <X aria-hidden className="size-4 opacity-70" />
        </button>
      </div>
    </div>
  )
}
