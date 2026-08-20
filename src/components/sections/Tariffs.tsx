import { useState } from 'react'
import { Check, Minus, Sofa } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Segmented } from '@/components/ui/Segmented'
import { Button } from '@/components/ui/Button'
import { furnishingAddon, tariffs, type PropertyType } from '@/data/tariffs'
import { formatDays, formatMoney, roundTo } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { useLeadModal } from '@/lib/leadModal'

const options = [
  { id: 'new' as PropertyType, label: 'Новостройка', sub: 'без отделки или с черновой' },
  { id: 'old' as PropertyType, label: 'Вторичка', sub: 'с демонтажом и заменой труб' },
]

const SAMPLE_AREA = 50

export function Tariffs() {
  const [property, setProperty] = useState<PropertyType>('new')
  const { region } = useRegion()
  const { openLead } = useLeadModal()

  const list = tariffs.filter((t) => t.property === property)

  return (
    <Section
      id="tariffs"
      tone="sand"
      eyebrow="Тарифы"
      title="Сколько стоит ремонт и что именно входит"
      lead={
        <>
          Цены за м² в {region.nameIn}. В тарифах без пометки «с материалами» указана только
          стоимость работ — материалы вы закупаете сами по нашей спецификации или доверяете нам.
        </>
      }
      headerAside={
        <Segmented
          options={options}
          value={property}
          onChange={setProperty}
          ariaLabel="Тип квартиры"
        />
      }
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {list.map((t) => {
          const perM2 = t.pricePerM2 * region.k
          const sample = roundTo(perM2 * SAMPLE_AREA, 5000)
          const hot = !!t.popular

          const meta = [
            { label: 'Срок работ', value: t.termFrom + '–' + t.termTo + ' дн.' },
            { label: 'Пример, ' + SAMPLE_AREA + ' м²', value: '~' + formatMoney(sample) },
          ]

          return (
            <article
              key={t.id}
              className={
                'group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-lift ' +
                (hot
                  ? 'border-navy bg-navy text-white shadow-lift'
                  : 'border-line bg-white hover:border-navy/25')
              }
            >
              <span
                aria-hidden
                className={
                  'absolute inset-x-0 top-0 h-1 bg-gold transition-opacity duration-300 ' +
                  (hot ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                }
              />
              {hot && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-gold/20 blur-[70px]"
                />
              )}

              {/* Слот бейджа одинаковой высоты во всех карточках — иначе заголовки разъезжаются */}
              <div className="relative mb-4 flex h-6 items-center">
                {hot && (
                  <span className="inline-flex items-center rounded-full bg-gold px-2.5 py-1 font-display text-[11px] leading-none font-medium tracking-wide text-white uppercase">
                    Чаще всего берут
                  </span>
                )}
              </div>

              <h3 className="relative flex min-h-14 items-start font-display text-xl leading-snug font-semibold">
                {t.name}
              </h3>

              <p
                className={
                  'relative mt-1 min-h-[68px] text-sm leading-relaxed ' +
                  (hot ? 'text-white/65' : 'text-subtle')
                }
              >
                {t.summary}
              </p>

              <p className="tnum relative mt-4 font-display text-[34px] leading-none font-bold">
                {formatMoney(perM2)}
                <span className={'text-base font-normal ' + (hot ? 'text-white/55' : 'text-subtle')}>
                  /м²
                </span>
              </p>
              <p className={'relative mt-2 text-[13px] ' + (hot ? 'text-white/55' : 'text-subtle')}>
                {t.withMaterials ? 'работы и материалы' : 'только работы'}
              </p>

              <div
                aria-hidden
                className={'relative mt-5 h-2 ' + (hot ? 'rule-ticks-gold opacity-80' : 'rule-ticks')}
              />

              <dl className="relative mt-3 text-[13.5px]">
                {meta.map((m, i) => (
                  <div
                    key={m.label}
                    className={
                      'flex items-baseline justify-between gap-3 py-2.5 ' +
                      (i === 0 ? (hot ? 'border-b border-white/10' : 'border-b border-line') : '')
                    }
                  >
                    <dt className={hot ? 'text-white/50' : 'text-subtle'}>{m.label}</dt>
                    <dd className="tnum font-display font-semibold whitespace-nowrap">{m.value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="relative mt-6 flex-1 space-y-2.5 text-[14px]">
                {t.includes.map((i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check
                      aria-hidden
                      className={'mt-0.5 size-4 shrink-0 ' + (hot ? 'text-gold-300' : 'text-gold')}
                    />
                    <span>{i}</span>
                  </li>
                ))}
                {t.excludes?.map((i) => (
                  <li key={i} className={'flex gap-2.5 ' + (hot ? 'text-white/45' : 'text-subtle')}>
                    <Minus aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={hot ? 'primary' : 'outline'}
                className="relative mt-7 w-full"
                onClick={() =>
                  openLead({
                    source: 'tariff:' + t.id,
                    title: 'Тариф «' + t.name + '»',
                    lead:
                      'Уточним детали по телефону и посчитаем смету под вашу площадь. Срок по тарифу — ' +
                      formatDays(t.termFrom) +
                      ' и больше.',
                    payload: { tariff: t.name, region: region.name },
                  })
                }
              >
                Рассчитать смету
              </Button>
            </article>
          )
        })}
      </div>

      {/* Комплектация мебелью — отдельная опция поверх любого тарифа */}
      <div className="mt-6 grid gap-6 overflow-hidden rounded-2xl border border-gold/35 bg-gold-100 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div className="flex gap-4">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold text-white"
          >
            <Sofa className="size-6" />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold text-navy">
              {furnishingAddon.name} —{' '}
              <span className="tnum text-gold">
                +{formatMoney(furnishingAddon.pricePerM2 * region.k)}/м²
              </span>
            </h3>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-navy-700">
              {furnishingAddon.summary}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-navy-700/80">
              {furnishingAddon.includes.map((i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check aria-hidden className="size-3.5 text-gold" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button
          size="lg"
          variant="dark"
          onClick={() =>
            openLead({
              source: 'furnishing',
              title: 'Ремонт с мебелью «под ключ»',
              lead: 'Расскажем, как считается комплектация и покажем примеры готовых квартир.',
            })
          }
        >
          Обсудить комплектацию
        </Button>
      </div>
    </Section>
  )
}
