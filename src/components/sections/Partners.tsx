import { Handshake, ExternalLink } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { useContent, mediaUrl } from '@/lib/content'

/** Поставщики и подрядчики: показываем, что закупка идёт не со случайного рынка. */
export function Partners() {
  const { partners } = useContent()

  if (!partners.length) return null

  return (
    <Section
      id="partners"
      tone="paper"
      eyebrow="Партнёры"
      title="С кем работаем"
      lead="Материалы и комплектующие идут от постоянных поставщиков: цены по договору, сроки поставки предсказуемые, гарантия — не на словах."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {partners.map((p) => {
          const inner = (
            <>
              <span className="grid h-16 place-items-center">
                {p.logo ? (
                  <img
                    src={mediaUrl(p.logo)}
                    alt={p.name}
                    loading="lazy"
                    className="max-h-14 max-w-[70%] object-contain"
                  />
                ) : (
                  <Handshake aria-hidden className="size-7 text-gold" />
                )}
              </span>
              <span className="mt-4 block font-display text-[15px] font-semibold">{p.name}</span>
              {p.note && (
                <span className="mt-1 block text-[13px] leading-snug text-subtle">{p.note}</span>
              )}
              {p.url && (
                <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold">
                  Сайт партнёра
                  <ExternalLink aria-hidden className="size-3.5" />
                </span>
              )}
            </>
          )

          const className =
            'block rounded-2xl border border-line bg-white p-5 text-center transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-navy/20 hover:shadow-card'

          return (
            <li key={p.name}>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noreferrer nofollow" className={className}>
                  {inner}
                </a>
              ) : (
                <div className={className}>{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
