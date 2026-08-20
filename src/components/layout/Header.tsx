import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useContent } from '@/lib/content'
import { track } from '@/lib/analytics'
import { useRegion } from '@/lib/region'
import { useLeadModal } from '@/lib/leadModal'
import { useLockBody } from '@/lib/useLockBody'
import { Logo, Wordmark } from '@/components/layout/Logo'

const nav = [
  { href: '#tariffs', label: 'Цены' },
  { href: '#price', label: 'Прайс' },
  { href: '#works', label: 'Работы' },
  { href: '#calc', label: 'Калькулятор' },
  { href: '#stages', label: 'Этапы' },
  { href: '#contacts', label: 'Контакты' },
]

const navMobile = [
  { href: '#tariffs', label: 'Цены и тарифы' },
  { href: '#price', label: 'Прайс на работы' },
  { href: '#works', label: 'Наши работы' },
  { href: '#calc', label: 'Калькулятор' },
  { href: '#stages', label: 'Как работаем' },
  { href: '#reviews', label: 'Отзывы' },
  { href: '#faq', label: 'Вопросы' },
  { href: '#contacts', label: 'Контакты' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { regionId, regions, setRegion } = useRegion()
  const { openLead } = useLeadModal()
  const { settings } = useContent()
  const phoneHref = 'tel:' + settings.phone.replace(/[^\d+]/g, '')
  useLockBody(menuOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={
        'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ' +
        (scrolled
          ? 'border-line bg-white/95 shadow-card backdrop-blur-md'
          : 'border-transparent bg-white')
      }
    >
      <div className="container-page flex h-16 items-center gap-3 md:h-20 md:gap-5">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={settings.brand + ' — на главную'}
        >
          <Logo className="size-9 shrink-0 text-navy md:size-10" />
          <span className="leading-tight">
            <Wordmark brand={settings.brand} className="block text-base md:text-lg" />
            <span className="hidden text-[11px] whitespace-nowrap text-subtle sm:block md:text-xs">
              ремонт квартир под ключ
            </span>
          </span>
        </a>

        <nav aria-label="Основная навигация" className="mx-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-[15px] whitespace-nowrap text-navy-700 transition-colors duration-200 hover:bg-sand hover:text-navy"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0 xl:gap-3">
          <div
            role="group"
            aria-label="Город"
            className="hidden shrink-0 rounded-lg border border-line p-0.5 md:flex"
          >
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                aria-pressed={regionId === r.id}
                className={
                  'cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ' +
                  (regionId === r.id ? 'bg-navy text-white' : 'text-subtle hover:text-navy')
                }
              >
                {r.name}
              </button>
            ))}
          </div>

          <span className="2xl:hidden">
            <ButtonLink
              href={phoneHref}
              variant="ghost"
              aria-label={'Позвонить: ' + settings.phone}
              onClick={() => track('call_click', { place: 'header' })}
              className="px-2.5"
            >
              <Phone aria-hidden className="size-5" />
            </ButtonLink>
          </span>

          <span className="hidden 2xl:block">
            <ButtonLink href={phoneHref} variant="ghost" className="tnum px-3 whitespace-nowrap">
              <Phone aria-hidden className="size-4" />
              {settings.phone}
            </ButtonLink>
          </span>

          <span className="hidden sm:block">
            <Button
              onClick={() => openLead({ source: 'header' })}
              className="whitespace-nowrap"
            >
              Записаться
            </Button>
          </span>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Открыть меню"
            className="grid size-11 cursor-pointer place-items-center rounded-lg text-navy transition-colors hover:bg-sand xl:hidden"
          >
            <Menu aria-hidden className="size-6" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-100 bg-ink/60 xl:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="ml-auto flex h-dvh w-[min(88vw,360px)] flex-col bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-bold">{settings.brand}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
                className="grid size-11 cursor-pointer place-items-center rounded-lg text-subtle hover:bg-sand"
              >
                <X aria-hidden className="size-6" />
              </button>
            </div>

            <div className="mb-6 flex rounded-xl border border-line p-1 md:hidden">
              {regions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegion(r.id)}
                  aria-pressed={regionId === r.id}
                  className={
                    'min-h-11 flex-1 cursor-pointer rounded-lg text-sm font-medium transition-colors ' +
                    (regionId === r.id ? 'bg-navy text-white' : 'text-subtle')
                  }
                >
                  {r.name}
                </button>
              ))}
            </div>

            <nav aria-label="Мобильная навигация" className="flex-1 overflow-y-auto">
              <ul className="flex flex-col">
                {navMobile.map((n) => (
                  <li key={n.href}>
                    <a
                      href={n.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-13 items-center border-b border-line font-display text-[17px] text-navy"
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={phoneHref} variant="outline" size="lg" className="tnum w-full">
                <Phone aria-hidden className="size-4" />
                {settings.phone}
              </ButtonLink>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setMenuOpen(false)
                  openLead({ source: 'mobile-menu' })
                }}
              >
                Записаться на консультацию
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
