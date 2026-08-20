import { Mail, Phone } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { site } from '@/config/site'
import { useRegion } from '@/lib/region'

const columns = [
  {
    title: 'Услуги',
    links: [
      { href: '#tariffs', label: 'Ремонт новостроек' },
      { href: '#tariffs', label: 'Ремонт вторички' },
      { href: '#tariffs', label: 'Комплектация мебелью' },
      { href: '#works', label: 'Дизайн-проект' },
    ],
  },
  {
    title: 'Цены',
    links: [
      { href: '#tariffs', label: 'Тарифы на ремонт' },
      { href: '#price', label: 'Прайс на работы' },
      { href: '#calc', label: 'Калькулятор' },
      { href: '#guarantees', label: 'Акции' },
    ],
  },
  {
    title: 'О компании',
    links: [
      { href: '#works', label: 'Наши работы' },
      { href: '#stages', label: 'Как работаем' },
      { href: '#guarantees', label: 'Гарантии' },
      { href: '#reviews', label: 'Отзывы' },
      { href: '#faq', label: 'Вопросы и ответы' },
    ],
  },
]

export function Footer() {
  const { region } = useRegion()
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-navy text-white/70">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-blueprint-dark mask-fade-y" />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-2 md:py-16 xl:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <Logo className="size-10 text-white/12" />
            <span className="font-display text-lg font-bold">{site.brand}</span>
          </div>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
            Ремонт квартир под ключ в {region.nameIn}. Фиксированная смета, прозрачный прайс,
            гарантия 5 лет.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <a href={site.phoneHref}
              className="tnum inline-flex min-h-11 items-center gap-2 text-white hover:text-gold-300">
              <Phone aria-hidden className="size-4" />
              {site.phone}
            </a>
            <a
              href={'mailto:' + site.email}
              className="inline-flex min-h-11 items-center gap-2 text-white hover:text-gold-300"
            >
              <Mail aria-hidden className="size-4" />
              {site.email}
            </a>
          </div>
        </div>

        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="mb-4 font-display text-[15px] font-semibold text-white">{c.title}</h2>
            <ul>
              {c.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="inline-flex min-h-11 items-center text-[15px] transition-colors hover:text-gold-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.brand}. {site.legal}, ИНН {site.inn}
          </p>
          <p id="privacy" className="max-w-xl sm:text-right">
            Цены на сайте не являются публичной офертой. Политика обработки персональных данных —
            документ в подготовке.
          </p>
        </div>
      </div>
    </footer>
  )
}
