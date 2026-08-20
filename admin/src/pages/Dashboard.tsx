import { useEffect, useMemo, useState } from 'react'
import { Table2 } from 'lucide-react'
import { api, type Metrics } from '@/lib/api'
import { Badge, Button, Card, PageHeader, Spinner, useToast } from '@/components/ui'
import { BarList, fmt, SERIES, StatTile, TimeSeries, type Point } from '@/components/charts'

const RANGES = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
]

/** Заполняет пропуски: дни без событий должны быть нулями, а не разрывом линии. */
function series(daily: Metrics['daily'], type: string, days: number): Point[] {
  const map = new Map(daily.filter((d) => d.type === type).map((d) => [d.day, d.c]))
  const out: Point[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ day: key, value: map.get(key) ?? 0 })
  }
  return out
}

export function Dashboard() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Metrics | null>(null)
  const [asTable, setAsTable] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    setData(null)
    api
      .get<Metrics>('/admin/metrics?days=' + days)
      .then(setData)
      .catch((e) => notify(e.message, 'bad'))
  }, [days, notify])

  const views = useMemo(() => (data ? series(data.daily, 'pageview', days) : []), [data, days])
  const leads = useMemo(() => (data ? series(data.daily, 'lead', days) : []), [data, days])

  return (
    <>
      <PageHeader
        title="Сводка"
        description="Своя статистика сайта: считается на нашем сервере, без внешних счётчиков. Яндекс.Метрика подключается отдельно в настройках."
        actions={
          <div className="flex rounded-lg border border-line bg-white p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                aria-pressed={days === r.days}
                className={
                  'min-h-9 cursor-pointer rounded-md px-3 text-[13px] font-medium transition-colors ' +
                  (days === r.days ? 'bg-navy text-white' : 'text-subtle hover:text-navy')
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {!data ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Просмотры страницы"
              value={fmt(data.totals.pageview ?? 0)}
              accent={SERIES.blue}
              hint={'за ' + days + ' дн.'}
            />
            <StatTile
              label="Уникальных посетителей"
              value={fmt(data.sessions)}
              accent={SERIES.teal}
              hint="по сессиям браузера"
            />
            <StatTile
              label="Заявок"
              value={fmt(data.leads)}
              accent={SERIES.amber}
              hint={'открытий формы: ' + fmt(data.totals.lead_open ?? 0)}
            />
            <StatTile
              label="Конверсия в заявку"
              value={data.conversion + '%'}
              accent={SERIES.rose}
              hint="заявки к просмотрам"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setAsTable((v) => !v)}>
              <Table2 aria-hidden className="size-4" />
              {asTable ? 'Показать графиками' : 'Показать таблицей'}
            </Button>
          </div>

          {asTable ? (
            <Card title="Динамика по дням" padded={false}>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-line text-[12px] tracking-wide text-subtle uppercase">
                      <th className="px-5 py-2.5 font-medium">Дата</th>
                      <th className="px-5 py-2.5 text-right font-medium">Просмотры</th>
                      <th className="px-5 py-2.5 text-right font-medium">Заявки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {views.map((v, i) => (
                      <tr key={v.day} className="border-b border-line/60 last:border-0">
                        <td className="px-5 py-2">{v.day}</td>
                        <td className="tnum px-5 py-2 text-right">{fmt(v.value)}</td>
                        <td className="tnum px-5 py-2 text-right">{fmt(leads[i]?.value ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Два отдельных графика вместо двух шкал на одном — величины разного порядка */
            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Просмотры страницы">
                <TimeSeries data={views} color={SERIES.blue} kind="area" valueLabel="просмотров" />
              </Card>
              <Card title="Заявки">
                <TimeSeries data={leads} color={SERIES.amber} kind="bars" valueLabel="заявок" />
              </Card>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Откуда приходят">
              <BarList items={data.channels} color={SERIES.teal} empty="Пока никто не заходил" />
              <p className="mt-4 text-[12px] text-subtle">
                Источник берётся из метки utm_source, а если её нет — из адреса, откуда пришёл
                посетитель.
              </p>
            </Card>

            <Card title="С каких кнопок оставляют заявки">
              <BarList
                items={data.leadSources.map((s) => ({ name: s.source || 'без метки', count: s.c }))}
                color={SERIES.amber}
                empty="Заявок пока нет"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(data.totals)
                  .filter(([t]) => !['pageview', 'lead'].includes(t))
                  .map(([t, c]) => (
                    <Badge key={t}>
                      {EVENT_LABELS[t] ?? t}: {fmt(c)}
                    </Badge>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

const EVENT_LABELS: Record<string, string> = {
  lead_open: 'открытий формы',
  calc_use: 'расчётов в калькуляторе',
  call_click: 'кликов по телефону',
  messenger_click: 'переходов в мессенджеры',
  price_search: 'поисков по прайсу',
  stage_slider: 'слайдер этапов',
  work_click: 'кликов по работам',
}
