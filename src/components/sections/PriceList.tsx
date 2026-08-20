import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { useContent } from '@/lib/content'
import { track } from '@/lib/analytics'
import { formatMoney } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { useLeadModal } from '@/lib/leadModal'

export function PriceList() {
  const { region } = useRegion()
  const { openLead } = useLeadModal()
  const { priceGroups } = useContent()
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

  // Первая группа открыта по умолчанию, но список приходит из админки
  const openGroup = openId ?? priceGroups[0]?.id ?? null

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
                    className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white px-5 py-5 text-left transition-colors hover:bg-sand md:px-7"
                  >
                    <span>
                      <span className="block font-display text-lg font-medium">{g.name}</span>
                      <span className="mt-0.5 block text-sm text-subtle">{g.hint}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tnum hidden text-sm text-subtle sm:block">
                        {g.items.length} поз.
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
                  <table className="w-full text-left">
                    <caption className="sr-only">{g.name}: цены на работы</caption>
                    <thead>
                      <tr className="text-[13px] tracking-wide text-subtle uppercase">
                        <th scope="col" className="py-3 font-medium">
                          Вид работ
                        </th>
                        <th scope="col" className="py-3 text-right font-medium">
                          Цена
                        </th>
                        <th scope="col" className="w-24 py-3 text-right font-medium">
                          Ед.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((i) => (
                        <tr key={i.name} className="border-t border-line/70">
                          <td className="py-3 pr-4 text-[15px]">{i.name}</td>
                          <td className="tnum py-3 text-right font-display font-medium whitespace-nowrap">
                            от {formatMoney(i.price * region.k)}
                          </td>
                          <td className="py-3 text-right text-sm whitespace-nowrap text-subtle">
                            {i.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-[15px] leading-relaxed text-navy-700">
          Нужен полный прайс в PDF или смета по вашей планировке? Пришлём файл в мессенджер — там
          видны объёмы, а не только цены за единицу.
        </p>
        <Button
          className="shrink-0"
          variant="dark"
          onClick={() =>
            openLead({
              source: 'price-pdf',
              title: 'Прайс-лист и пример сметы',
              lead: 'Отправим полный прайс и пример реальной сметы на квартиру 58 м².',
            })
          }
        >
          Запросить прайс и пример сметы
        </Button>
      </div>
    </Section>
  )
}
