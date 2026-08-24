import { useMemo, useState } from 'react'
import { ChevronDown, Download, Search } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useContent, API_ENABLED, API_URL } from '@/lib/content'
import { RichText } from '@/components/ui/RichText'
import { track } from '@/lib/analytics'
import { formatMoney, plural } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { useLeadModal } from '@/lib/leadModal'

export function PriceList() {
  const { region } = useRegion()
  const { openLead } = useLeadModal()
  const { priceGroups, settings } = useContent()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const q = query.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!q) return priceGroups
    // Ищем по основе слова, чтобы «стяжка» находила и «стяжки», и «стяжку».
    const stems = q.split(/\s+/).map((w) => w.slice(0, Math.max(4, w.length - 2)))
    const match = (name: string) => {
      const n = name.toLowerCase()
      return stems.every((s) => n.includes(s))
    }
    return priceGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => match(i.name)) }))
      .filter((g) => g.items.length > 0)
  }, [q, priceGroups])

  const total = priceGroups.reduce((acc, g) => acc + g.items.length, 0)

  // Ни одна группа не обязана быть открытой: держать что-то раскрытым
  // постоянно — лишний визуальный шум
  const openGroup = openId

  return (
    <Section
      id="price"
      tone="sand"
      eyebrow="Прайс-лист"
      title="Цена за каждый вид работ"
      lead={
        <>
          {total} позиций, которые реально встречаются в квартире. Цены на работы в {region.nameIn},
          материалы считаются отдельно. Смета собирается из этих же строк — её можно проверить
          построчно.
        </>
      }
      headerAside={
        <label className="relative block w-full md:w-96">
          <span className="sr-only">Поиск по прайсу</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-subtle"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={(e) => e.target.value.trim() && track('price_search', { q: e.target.value.trim() })}
            placeholder="Стяжка, плитка, розетка…"
            className="h-12 w-full rounded-xl border border-line bg-white pr-4 pl-12 text-base outline-none transition-colors focus:border-navy"
          />
        </label>
      }
    >
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <p className="font-display text-lg font-medium">Такой работы нет в прайсе</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-subtle">
            Это не значит, что мы её не делаем — в прайсе только частые позиции. Напишите, что нужно,
            и мы посчитаем отдельно.
          </p>
          <Button
            className="mt-5"
            onClick={() =>
              openLead({
                source: 'price-empty',
                title: 'Посчитать работу не из прайса',
                payload: { query },
              })
            }
          >
            Запросить расчёт
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          {groups.map((g) => {
            const open = q ? true : openGroup === g.id
            return (
              <div key={g.id} className="border-b border-line last:border-b-0">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={'price-' + g.id}
                    onClick={() => setOpenId(open && !q ? null : g.id)}
                    aria-label={(open ? 'Свернуть' : 'Развернуть') + ': ' + g.name}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white px-5 py-5 text-left transition-colors hover:bg-sand md:px-7"
                  >
                    <span>
                      <span className="block font-display text-lg font-medium">{g.name}</span>
                      <span className="mt-0.5 block text-sm text-subtle">{g.hint}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tnum hidden text-sm text-subtle sm:block">
                        {g.total} поз.
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={
                          'size-5 shrink-0 text-subtle transition-transform duration-300 ' +
                          (open ? 'rotate-180' : '')
                        }
                      />
                    </span>
                  </button>
                </h3>

                <div id={'price-' + g.id} hidden={!open} className="bg-sand/70 px-5 pb-5 md:px-7">
                  <table className="w-full table-fixed text-left">
                    <caption className="sr-only">{g.name}: цены на работы</caption>
                    <colgroup>
                      <col />
                      <col className="w-[140px]" />
                      <col className="w-[180px]" />
                    </colgroup>
                    <thead>
                      <tr className="text-[13px] tracking-wide text-subtle uppercase">
                        <th scope="col" className="py-3 font-medium">
                          Вид работ
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">
                          Цена
                        </th>
                        <th scope="col" className="py-3 text-right font-medium">
                          Ед.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((i) => (
                        <tr key={i.name} className="border-t border-line/70 align-top">
                          <td className="py-3 pr-4 text-[15px]">
                            <RichText text={i.name} emphasis={i.emphasis} />
                            {i.comment && (
                              <span className="mt-1 block text-[13px] leading-snug whitespace-pre-line text-subtle italic">
                                {i.comment}
                              </span>
                            )}
                          </td>
                          <td className="tnum px-4 py-3 text-right font-display font-medium whitespace-nowrap">
                            {i.price > 0 ? 'от ' + formatMoney(i.price * region.k) : '—'}
                          </td>
                          <td className="py-3 text-right text-sm leading-snug text-balance text-subtle">
                            {i.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {g.hidden > 0 && (
                    <p className="border-t border-line/70 pt-3 text-[13px] text-subtle">
                      Ещё {g.hidden} {plural(g.hidden, ['позиция', 'позиции', 'позиций'])} этой
                      группы — в полном прайсе PDF.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-[15px] leading-relaxed text-navy-700">
          {settings.pricePdfNote ||
            'Полный прайс со всеми позициями — в PDF по кнопке справа.'}{' '}
          Файл собирается из этой же таблицы, поэтому всегда актуален.
        </p>

        <div className="flex shrink-0 flex-wrap gap-2">
          {API_ENABLED && (
            <ButtonLink
              href={API_URL + '/api/price.pdf?region=' + region.id}
              variant="dark"
              onClick={() => track('price_pdf', { region: region.id })}
            >
              <Download aria-hidden className="size-4" />
              Скачать прайс в PDF
            </ButtonLink>
          )}
          <Button
            variant="outline"
            onClick={() =>
              openLead({
                source: 'price-estimate',
                title: 'Смета по вашей планировке',
                lead: 'Пришлём смету с объёмами под вашу квартиру — в ней те же строки, что в прайсе.',
              })
            }
          >
            Смету по моей квартире
          </Button>
        </div>
      </div>
    </Section>
  )
}
