import { useCallback, useEffect, useState } from 'react'
import { Download, Phone, Search, Trash2 } from 'lucide-react'
import { api, LEAD_STATUSES, statusLabel, type Lead, type LeadStatus } from '@/lib/api'
import { Badge, Button, Card, Empty, PageHeader, Spinner, useConfirm, useToast } from '@/components/ui'

const money = (n: unknown) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
    .format(Math.round(Number(n) || 0))

const when = (iso: string) =>
  new Date(iso.replace(' ', 'T') + 'Z').toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const toneOf = (s: string) => LEAD_STATUSES.find((x) => x.id === s)?.tone ?? 'neutral'

export function Leads() {
  const [items, setItems] = useState<Lead[] | null>(null)
  const [byStatus, setByStatus] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<'' | LeadStatus>('')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const { notify } = useToast()
  const { confirm, dialog } = useConfirm()

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    api
      .get<{ items: Lead[]; total: number; byStatus: Record<string, number> }>(
        '/admin/leads?' + params.toString(),
      )
      .then((r) => {
        setItems(r.items)
        setTotal(r.total)
        setByStatus(r.byStatus)
      })
      .catch((e) => notify(e.message, 'bad'))
  }, [status, q, notify])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const patch = async (lead: Lead, body: Partial<Lead>) => {
    try {
      const updated = await api.put<Lead>('/admin/leads/' + lead.id, body)
      setItems((v) => (v ?? []).map((x) => (x.id === lead.id ? updated : x)))
      load()
    } catch (e) {
      notify((e as Error).message, 'bad')
    }
  }

  const remove = async (lead: Lead) => {
    if (!(await confirm('Удалить заявку от ' + lead.phone + '?'))) return
    try {
      await api.del('/admin/leads/' + lead.id)
      setItems((v) => (v ?? []).filter((x) => x.id !== lead.id))
      notify('Заявка удалена')
    } catch (e) {
      notify((e as Error).message, 'bad')
    }
  }

  return (
    <>
      <PageHeader
        title="Заявки"
        description="Всё, что пришло с сайта. Заявка из калькулятора приходит вместе с расчётом."
        actions={
          <a
            href="/api/admin/leads/export.csv"
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 font-display text-sm font-medium text-navy hover:bg-sand"
          >
            <Download aria-hidden className="size-4" />
            Выгрузить в CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatus('')}
          aria-pressed={status === ''}
          className={
            'min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium transition-colors ' +
            (status === '' ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy-600')
          }
        >
          Все
        </button>
        {LEAD_STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatus(s.id)}
            aria-pressed={status === s.id}
            className={
              'min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium transition-colors ' +
              (status === s.id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy-600')
            }
          >
            {s.label}
            {byStatus[s.id] ? <span className="tnum ml-1.5 opacity-70">{byStatus[s.id]}</span> : null}
          </button>
        ))}

        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Поиск по заявкам</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
          />
          <input
            className="field pl-9"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Имя, телефон, текст"
          />
        </label>
      </div>

      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty
          title="Заявок нет"
          hint={
            q || status
              ? 'Под этот фильтр ничего не подходит.'
              : 'Как только с сайта придёт первая заявка, она появится здесь и продублируется в Telegram.'
          }
        />
      ) : (
        <Card padded={false} title={<span className="tnum text-subtle">Всего: {total}</span>}>
          <ul className="divide-y divide-line">
            {items.map((lead) => {
              const isOpen = open === lead.id
              const p = lead.payload ?? {}
              return (
                <li key={lead.id}>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : lead.id)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <p className="flex items-center gap-2 font-display text-[15px] font-medium">
                        {lead.name || 'Без имени'}
                        <span className="tnum text-subtle">{lead.phone}</span>
                      </p>
                      <p className="truncate text-[13px] text-subtle">
                        {when(lead.created_at)} · {lead.source || 'без метки'}
                        {p.tariff ? ' · ' + String(p.tariff) : ''}
                        {p.area ? ', ' + String(p.area) + ' м²' : ''}
                      </p>
                    </button>

                    <Badge tone={toneOf(lead.status)}>{statusLabel(lead.status)}</Badge>

                    <a
                      href={'tel:' + lead.phone.replace(/[^\d+]/g, '')}
                      aria-label={'Позвонить ' + lead.phone}
                      className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-white text-navy hover:bg-sand"
                    >
                      <Phone aria-hidden className="size-4" />
                    </a>
                    <Button variant="danger" aria-label="Удалить" onClick={() => remove(lead)}>
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="grid gap-5 border-t border-line bg-sand/50 px-4 py-4 lg:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        {lead.comment && (
                          <div>
                            <p className="text-[12px] tracking-wide text-subtle uppercase">
                              Комментарий клиента
                            </p>
                            <p className="mt-1 text-sm">{lead.comment}</p>
                          </div>
                        )}

                        {!!Object.keys(p).length && (
                          <div>
                            <p className="text-[12px] tracking-wide text-subtle uppercase">
                              Расчёт из калькулятора
                            </p>
                            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                              {p.tariff ? <Pair k="Тариф" v={String(p.tariff)} /> : null}
                              {p.region ? <Pair k="Город" v={String(p.region)} /> : null}
                              {p.area ? <Pair k="Площадь" v={String(p.area) + ' м²'} /> : null}
                              {p.rooms ? (
                                <Pair
                                  k="Комнат / санузлов"
                                  v={String(p.rooms) + ' / ' + String(p.bathrooms ?? 1)}
                                />
                              ) : null}
                              {p.materials ? <Pair k="Материалы" v={String(p.materials)} /> : null}
                              {Array.isArray(p.extras) && p.extras.length > 0 && (
                                <Pair k="Допы" v={(p.extras as string[]).join(', ')} />
                              )}
                              {p.min != null && (
                                <Pair k="Вилка" v={money(p.min) + ' — ' + money(p.max)} />
                              )}
                              {p.days ? <Pair k="Срок" v={'≈ ' + String(p.days) + ' дн.'} /> : null}
                            </dl>
                          </div>
                        )}

                        {!!Object.keys(lead.utm ?? {}).length && (
                          <div>
                            <p className="text-[12px] tracking-wide text-subtle uppercase">Источник</p>
                            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                              {Object.entries(lead.utm).map(([k, v]) => (
                                <Pair key={k} k={k} v={v} />
                              ))}
                            </dl>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="mb-1.5 text-[12px] tracking-wide text-subtle uppercase">
                            Статус
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {LEAD_STATUSES.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => patch(lead, { status: s.id })}
                                className={
                                  'min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] transition-colors ' +
                                  (lead.status === s.id
                                    ? 'border-navy bg-navy text-white'
                                    : 'border-line bg-white text-navy-600 hover:bg-sand')
                                }
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="mb-1.5 text-[12px] tracking-wide text-subtle uppercase">
                            Заметка менеджера
                          </p>
                          <textarea
                            className="field"
                            rows={4}
                            defaultValue={lead.admin_note}
                            placeholder="Договорились на замер в четверг в 14:00"
                            onBlur={(e) =>
                              e.target.value !== lead.admin_note &&
                              patch(lead, { admin_note: e.target.value })
                            }
                          />
                          <p className="mt-1 text-[12px] text-subtle">
                            Сохраняется, когда убираете курсор из поля.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {dialog}
    </>
  )
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-subtle">{k}</dt>
      <dd className="tnum font-medium">{v}</dd>
    </>
  )
}
