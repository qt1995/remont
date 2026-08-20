import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useContent } from '@/lib/content'
import { track } from '@/lib/analytics'
import { useLeadModal } from '@/lib/leadModal'

/** Панель с обратной связью на мобильных — появляется, когда герой уже прокручен. */
export function MobileCta() {
  const [shown, setShown] = useState(false)
  const { openLead } = useLeadModal()
  const { settings } = useContent()
  const phoneHref = 'tel:' + settings.phone.replace(/[^\d+]/g, '')

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out-soft)] sm:hidden ' +
        (shown ? 'translate-y-0' : 'translate-y-full')
      }
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-hidden={!shown}
    >
      <div className="flex gap-2 p-3">
        <ButtonLink
          href={phoneHref}
          variant="outline"
          size="lg"
          className="shrink-0 px-4"
          aria-label={'Позвонить: ' + settings.phone}
          onClick={() => track('call_click', { place: 'mobile-bar' })}
          tabIndex={shown ? undefined : -1}
        >
          <Phone aria-hidden className="size-5" />
        </ButtonLink>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => openLead({ source: 'mobile-bar' })}
          tabIndex={shown ? undefined : -1}
        >
          Записаться на замер
        </Button>
      </div>
    </div>
  )
}
