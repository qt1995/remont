import { useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink, FileDown, Save } from 'lucide-react'
import { api, type Settings } from '@/lib/api'
import { Button, Card, PageHeader, Spinner, Toggle, useToast } from '@/components/ui'

const DOCS = [
  {
    key: 'privacyText',
    kind: 'privacy',
    title: 'Политика обработки персональных данных',
    url: '/privacy',
    hint: 'Обязательный документ: закон требует держать его в свободном доступе на сайте. Ссылка стоит в подвале и рядом с кнопкой отправки формы.',
  },
  {
    key: 'contractText',
    kind: 'contract',
    title: 'Договор подряда',
    url: '/contract',
    hint: 'Типовая форма для клиентов: фиксированная смета, поэтапная оплата, неустойка за просрочку, гарантия два года.',
  },
] as const

export function LegalPage() {
  const [values, setValues] = useState<Settings | null>(null)
  const [saving, setSaving] = useState('')
  const { notify } = useToast()

  useEffect(() => {
    api
      .get<Settings>('/admin/settings')
      .then(setValues)
      .catch((e) => notify(e.message, 'bad'))
  }, [notify])

  if (!values) return <Spinner />

  const set = (k: string, v: string) => setValues({ ...values, [k]: v })

  const save = async (key: string) => {
    setSaving(key)
    try {
      const next = await api.put<Settings>('/admin/settings', { [key]: values[key] ?? '' })
      setValues(next)
      notify('Сохранено')
    } catch (e) {
      notify((e as Error).message, 'bad')
    } finally {
      setSaving('')
    }
  }

  const loadTemplate = async (kind: string, key: string) => {
    try {
      const r = await api.get<{ text: string }>('/admin/legal/' + kind + '/template')
      set(key, r.text)
      notify('Шаблон загружен — не забудьте сохранить')
    } catch (e) {
      notify((e as Error).message, 'bad')
    }
  }

  return (
    <>
      <PageHeader
        title="Документы"
        description="Политика обработки персональных данных и договор. Пока поле пустое, на сайте показывается встроенный шаблон с вашими реквизитами из «Настроек»."
      />

      <div className="mb-5 flex gap-3 rounded-xl border border-warn/30 bg-warn-bg p-4">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warn" />
        <div className="text-[13px] leading-relaxed text-navy-700">
          <p className="font-display font-semibold text-warn">Это шаблоны, а не готовые документы</p>
          <p className="mt-1">
            Тексты составлены по типовой практике и подставляют ваши реквизиты, но их должен
            прочитать юрист перед тем, как вы начнёте подписывать договоры и принимать заявки. В
            договоре остались пропуски: адрес объекта, сроки, суммы и банковские реквизиты — их
            заполняют при подписании.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <Card title="Уведомление о файлах cookie">
          <Toggle
            checked={values.cookieNotice === '1'}
            onChange={(v) => {
              set('cookieNotice', v ? '1' : '0')
              api.put('/admin/settings', { cookieNotice: v ? '1' : '0' }).catch(() => {})
            }}
            label="Показывать посетителям полоску про cookie со ссылкой на политику"
          />
          <p className="mt-2 text-[13px] text-subtle">
            Не блокирует сайт: закрывается одной кнопкой и больше не появляется.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        {DOCS.map((d) => (
          <Card
            key={d.key}
            title={d.title}
            actions={
              <>
                <Button type="button" onClick={() => loadTemplate(d.kind, d.key)}>
                  <FileDown aria-hidden className="size-4" />
                  Загрузить шаблон в поле
                </Button>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3.5 font-display text-sm font-medium hover:bg-sand"
                >
                  <ExternalLink aria-hidden className="size-4" />
                  Посмотреть на сайте
                </a>
                <Button variant="primary" loading={saving === d.key} onClick={() => save(d.key)}>
                  <Save aria-hidden className="size-4" />
                  Сохранить
                </Button>
              </>
            }
          >
            <p className="mb-3 text-[13px] text-subtle">{d.hint}</p>
            <textarea
              className="field font-mono text-[13px] leading-relaxed"
              rows={18}
              placeholder="Пусто — на сайте показывается встроенный шаблон. Нажмите «Загрузить шаблон в поле», чтобы начать править его текст."
              value={values[d.key] ?? ''}
              onChange={(e) => set(d.key, e.target.value)}
            />
            <p className="mt-2 text-[12px] text-subtle">
              Разметка простая: строка с «# » — заголовок документа, «## » — раздел, «- » — пункт
              списка, **жирный** между звёздочками.
            </p>
          </Card>
        ))}
      </div>
    </>
  )
}
