import { useState } from 'react'
import { ArrowRight, Box, CalendarDays, Ruler, Wallet } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Segmented } from '@/components/ui/Segmented'
import { Button } from '@/components/ui/Button'
import { workFilters, works } from '@/data/portfolio'
import { formatDays, formatMoney } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { useLeadModal } from '@/lib/leadModal'
import { asset } from '@/lib/asset'

type FilterId = (typeof workFilters)[number]['id']

export function Portfolio() {
  const [filter, setFilter] = useState<FilterId>('all')
  const { region } = useRegion()
  const { openLead } = useLeadModal()

  const list = filter === 'all' ? works : works.filter((w) => w.type === filter)

  return (
    <Section
      id="works"
      eyebrow="Наши работы"
      title="Объекты, которые уже сданы"
      lead="У каждого объекта — площадь, срок и итоговая сумма. Это те же цифры, что были в договоре: сравните их с прайсом выше."
      headerAside={
        <Segmented
          options={workFilters}
          value={filter}
          onChange={setFilter}
          ariaLabel="Фильтр по типу объекта"
          size="sm"
        />
      }
    >
      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map((w) => (
          <li
            key={w.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-navy/20 hover:shadow-lift"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={asset(w.image)}
                alt={w.title + ' — ' + w.style}
                width={800}
                height={600}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.05]"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent"
              />

              <span className="absolute top-4 left-4 rounded-full bg-white/92 px-3 py-1 font-display text-xs font-medium text-navy backdrop-blur-sm">
                {w.typeLabel}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-display text-[19px] leading-snug font-semibold">{w.title}</h3>
                <p className="mt-1 text-sm text-white/75">{w.style}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5 md:p-6">
              <dl className="grid grid-cols-3 gap-3 text-[13px]">
                <div>
                  <dt className="flex items-center gap-1.5 text-subtle">
                    <Ruler aria-hidden className="size-3.5" />
                    Площадь
                  </dt>
                  <dd className="tnum mt-1 font-display text-[15px] font-semibold">{w.area} м²</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-subtle">
                    <CalendarDays aria-hidden className="size-3.5" />
                    Срок
                  </dt>
                  <dd className="tnum mt-1 font-display text-[15px] font-semibold">
                    {formatDays(w.days)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-subtle">
                    <Wallet aria-hidden className="size-3.5" />
                    Бюджет
                  </dt>
                  <dd className="tnum mt-1 font-display text-[15px] font-semibold whitespace-nowrap">
                    {formatMoney(w.budget * region.k)}
                  </dd>
                </div>
              </dl>

              <div aria-hidden className="mt-5 h-2 rule-ticks opacity-70" />

              <ul className="mt-5 flex flex-1 flex-wrap gap-2">
                {w.scope.map((sc) => (
                  <li key={sc} className="rounded-lg bg-sand px-2.5 py-1 text-[13px] text-navy-700">
                    {sc}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  openLead({
                    source: 'work:' + w.id,
                    title: 'Хочу так же: ' + w.title,
                    lead: 'Покажем полный фотоотчёт по объекту и посчитаем аналогичный ремонт под вашу площадь.',
                    payload: { work: w.title, area: w.area },
                  })
                }
                className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 self-start font-display text-[15px] font-medium text-gold transition-colors hover:text-gold-600"
              >
                Хочу такой же
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Визуализации до начала работ */}
      <div className="mt-8 grid gap-6 rounded-2xl border border-line bg-sand p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div className="flex gap-4">
          <Box aria-hidden className="mt-1 size-7 shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-xl font-semibold">
              Сначала картинка — потом стройка
            </h3>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-navy-700">
              До первого мешка штукатурки вы получаете 3D-визуализацию каждой комнаты и планировочное
              решение. Согласовали картинку — по ней и делаем, без «а давайте здесь по-другому» на
              середине ремонта.
            </p>
          </div>
        </div>
        <Button
          variant="dark"
          size="lg"
          className="shrink-0"
          onClick={() =>
            openLead({
              source: 'visualization',
              title: 'Дизайн-проект и визуализация',
              lead: 'Покажем примеры визуализаций и расскажем, что входит в проект и сколько он стоит.',
            })
          }
        >
          Посмотреть визуализации
        </Button>
      </div>
    </Section>
  )
}
