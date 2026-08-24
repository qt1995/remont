import { useEffect, useState } from 'react'
import { BarChart3, ExternalLink, KeyRound, Save, Search, Send } from 'lucide-react'
import { api, type Settings as SettingsMap } from '@/lib/api'
import { Button, Card, Field, PageHeader, Spinner, Toggle, useToast } from '@/components/ui'
import { CollectionEditor } from '@/components/CollectionEditor'
import { ImagePicker } from '@/components/ImagePicker'

export function SettingsPage() {
  const [s, setS] = useState<SettingsMap | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    api
      .get<SettingsMap>('/admin/settings')
      .then(setS)
      .catch((e) => notify(e.message, 'bad'))
  }, [notify])

  const set = (k: string, v: string) => setS((p) => (p ? { ...p, [k]: v } : p))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!s) return
    setSaving(true)
    try {
      const next = await api.put<SettingsMap>('/admin/settings', s)
      setS(next)
      notify('Настройки сохранены')
    } catch (err) {
      notify((err as Error).message, 'bad')
    } finally {
      setSaving(false)
    }
  }

  const testTelegram = async () => {
    if (!s) return
    setTesting(true)
    try {
      const r = await api.post<{ ok: boolean; error?: string }>('/admin/settings/telegram-test', {
        telegramBotToken: s.telegramBotToken,
        telegramChatId: s.telegramChatId,
      })
      if (r.ok) notify('Сообщение отправлено — проверьте чат')
      else notify(r.error ?? 'Не отправилось', 'bad')
    } catch (err) {
      notify((err as Error).message, 'bad')
    } finally {
      setTesting(false)
    }
  }

  if (!s) return <Spinner />

  return (
    <>
      <PageHeader
        title="Настройки"
        description="Контакты, уведомления и подключение аналитики. Всё это подставляется на сайт сразу после сохранения."
      />

      <form onSubmit={save} className="flex flex-col gap-5">
        <Card
          title="Компания и контакты"
          actions={
            <Button type="submit" variant="primary" loading={saving}>
              <Save aria-hidden className="size-4" />
              Сохранить
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название компании">
              <input className="field" value={s.brand} onChange={(e) => set('brand', e.target.value)} />
            </Field>
            <Field label="Слоган">
              <input className="field" value={s.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Телефон" hint="В том виде, в каком показывать на сайте">
              <input className="field tnum" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Почта">
              <input className="field" type="email" value={s.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Telegram для клиентов" hint="Ссылка вида https://t.me/имя">
              <input className="field" value={s.telegram} onChange={(e) => set('telegram', e.target.value)} />
            </Field>
            <Field label="WhatsApp" hint="Ссылка вида https://wa.me/79990000000">
              <input className="field" value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <Field label="Часы работы">
              <input className="field" value={s.workHours} onChange={(e) => set('workHours', e.target.value)} />
            </Field>
            <Field label="Юрлицо">
              <input className="field" value={s.legal} onChange={(e) => set('legal', e.target.value)} />
            </Field>
            <Field label="ИНН">
              <input className="field tnum" value={s.inn} onChange={(e) => set('inn', e.target.value)} />
            </Field>
            <Field
              label="Площадь для примера в тарифах, м²"
              hint="На карточках показывается «Пример, N м²»"
            >
              <input
                className="field tnum"
                type="number"
                value={s.sampleArea}
                onChange={(e) => set('sampleArea', e.target.value)}
              />
            </Field>
          </div>

          <fieldset className="mt-6 border-t border-line pt-5">
            <legend className="sr-only">Офис</legend>
            <h3 className="mb-1 font-display text-[15px] font-semibold">Офис</h3>
            <p className="mb-4 text-[13px] text-subtle">
              Пока адрес пустой, сайт честно пишет «приезжаем к вам сами» вместо выдуманного адреса.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Адрес">
                <input
                  className="field"
                  value={s.officeAddress}
                  onChange={(e) => set('officeAddress', e.target.value)}
                  placeholder="Тюмень, ул. Ленина, 1, офис 200"
                />
              </Field>
              <Field label="Часы приёма">
                <input
                  className="field"
                  value={s.officeHours}
                  onChange={(e) => set('officeHours', e.target.value)}
                />
              </Field>
              <Field label="Ссылка на карту" className="sm:col-span-2">
                <input
                  className="field"
                  value={s.officeMapUrl}
                  onChange={(e) => set('officeMapUrl', e.target.value)}
                />
              </Field>
            </div>
          </fieldset>
        </Card>

        <Card title="Первый экран и прайс">
          <p className="mb-5 max-w-2xl text-[13px] text-subtle">
            Какие цены показывать в шапке и сколько строк прайса пускать на сайт.
            Коэффициенты калькулятора — в разделе «Калькулятор».
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Первая цена на главном экране"
              hint="Идентификатор тарифа, например new-rough. Пусто — выберется сам."
            >
              <input
                className="field"
                value={s.heroTariffA ?? ''}
                onChange={(e) => set('heroTariffA', e.target.value)}
                placeholder="new-rough"
              />
            </Field>
            <Field label="Подпись к первой цене" hint="Пусто — возьмётся название тарифа">
              <input
                className="field"
                value={s.heroPriceLabelA ?? ''}
                onChange={(e) => set('heroPriceLabelA', e.target.value)}
                placeholder="Черновой ремонт"
              />
            </Field>
            <Field label="Вторая цена на главном экране" hint="Например new-turnkey">
              <input
                className="field"
                value={s.heroTariffB ?? ''}
                onChange={(e) => set('heroTariffB', e.target.value)}
                placeholder="new-turnkey"
              />
            </Field>
            <Field label="Подпись ко второй цене">
              <input
                className="field"
                value={s.heroPriceLabelB ?? ''}
                onChange={(e) => set('heroPriceLabelB', e.target.value)}
                placeholder="Под ключ"
              />
            </Field>
          </div>

          <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <Field
              label="Строк прайса на сайте"
              hint="Сколько позиций показывать в группе. Остальные уйдут в PDF. 0 — показывать все."
            >
              <input
                className="field tnum"
                type="number"
                value={s.priceVisibleLimit ?? ''}
                onChange={(e) => set('priceVisibleLimit', e.target.value)}
              />
            </Field>
            <Field label="Подпись под прайсом">
              <input
                className="field"
                value={s.pricePdfNote ?? ''}
                onChange={(e) => set('pricePdfNote', e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card title="Комплектация мебелью">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название опции">
              <input
                className="field"
                value={s.furnishingName ?? ''}
                onChange={(e) => set('furnishingName', e.target.value)}
              />
            </Field>
            <Field label="Цена за м², ₽" hint="База по Тюмени">
              <input
                className="field tnum"
                type="number"
                value={s.furnishingPricePerM2 ?? ''}
                onChange={(e) => set('furnishingPricePerM2', e.target.value)}
              />
            </Field>
            <Field label="Описание" className="sm:col-span-2">
              <textarea
                className="field"
                rows={3}
                value={s.furnishingSummary ?? ''}
                onChange={(e) => set('furnishingSummary', e.target.value)}
              />
            </Field>
            <Field
              label="Что входит"
              hint="По одному пункту в строке"
              className="sm:col-span-2"
            >
              <textarea
                className="field"
                rows={4}
                value={parseList(s.furnishingIncludes).join('\n')}
                onChange={(e) => set('furnishingIncludes', JSON.stringify(splitList(e.target.value)))}
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Уведомления в Telegram"
          actions={
            <Button type="button" onClick={testTelegram} loading={testing}>
              <Send aria-hidden className="size-4" />
              Отправить тест
            </Button>
          }
        >
          <p className="mb-4 max-w-2xl text-[13px] text-subtle">
            Заведите бота у <b>@BotFather</b>, скопируйте токен. Затем напишите боту любое сообщение
            и возьмите ID чата у <b>@userinfobot</b> — для группы ID начинается с минуса.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Токен бота" hint="После сохранения показывается только хвост — это нормально">
              <input
                className="field"
                value={s.telegramBotToken}
                onChange={(e) => set('telegramBotToken', e.target.value)}
                placeholder="1234567890:AA..."
              />
            </Field>
            <Field label="ID чата">
              <input
                className="field tnum"
                value={s.telegramChatId}
                onChange={(e) => set('telegramChatId', e.target.value)}
                placeholder="123456789"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Toggle
              checked={s.telegramNotify === '1'}
              onChange={(v) => set('telegramNotify', v ? '1' : '0')}
              label="Дублировать заявки в Telegram"
            />
          </div>
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Search aria-hidden className="size-4 text-gold" />
              SEO: как сайт выглядит в поиске и мессенджерах
            </span>
          }
        >
          <p className="mb-5 max-w-2xl text-[13px] text-subtle">
            Эти поля подставляются в HTML на сервере — до того, как страница уйдёт роботу.
            Заодно из них собираются <code>robots.txt</code>, <code>sitemap.xml</code> и разметка
            организации для Яндекса и Google.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Адрес сайта"
              hint="С https и без слеша на конце. Нужен для canonical и карты сайта."
              className="sm:col-span-2"
            >
              <input
                className="field"
                value={s.siteUrl ?? ''}
                onChange={(e) => set('siteUrl', e.target.value)}
                placeholder="https://pro-comfort.pro"
              />
            </Field>

            <Field
              label="Заголовок страницы"
              hint={counter(s.seoTitle, 60, 'В выдаче обрезается примерно на 60 символах')}
              className="sm:col-span-2"
            >
              <input
                className="field"
                value={s.seoTitle ?? ''}
                onChange={(e) => set('seoTitle', e.target.value)}
              />
            </Field>

            <Field
              label="Описание"
              hint={counter(s.seoDescription, 160, 'Показывается под ссылкой в выдаче, ~160 символов')}
              className="sm:col-span-2"
            >
              <textarea
                className="field"
                rows={3}
                value={s.seoDescription ?? ''}
                onChange={(e) => set('seoDescription', e.target.value)}
              />
            </Field>

            <div className="sm:col-span-2">
              <ImagePicker
                label="Картинка для ссылок"
                value={s.seoOgImage ?? ''}
                onChange={(v) => set('seoOgImage', v)}
              />
              <p className="mt-1 text-[12px] text-subtle">
                Она показывается, когда сайт кидают в Telegram или WhatsApp. Лучший размер —
                1200×630.
              </p>
            </div>

            <Field label="Индексация" hint="На время правок можно закрыть сайт от поисковиков">
              <select
                className="field"
                value={s.seoRobots ?? 'index'}
                onChange={(e) => set('seoRobots', e.target.value)}
              >
                <option value="index">Открыт для поисковиков</option>
                <option value="noindex">Закрыт от индексации</option>
              </select>
            </Field>

            <Field label="Код подтверждения Яндекса" hint="Из Яндекс.Вебмастера, мета-тег">
              <input
                className="field"
                value={s.yandexVerification ?? ''}
                onChange={(e) => set('yandexVerification', e.target.value)}
              />
            </Field>

            <Field label="Код подтверждения Google" hint="Из Google Search Console" className="sm:col-span-2">
              <input
                className="field"
                value={s.googleVerification ?? ''}
                onChange={(e) => set('googleVerification', e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-medium hover:bg-sand"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              robots.txt
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-medium hover:bg-sand"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              sitemap.xml
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-medium hover:bg-sand"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              Открыть сайт
            </a>
          </div>
        </Card>

        <Card title="Яндекс.Метрика">
          <div className="flex flex-wrap items-end gap-4">
            <Field
              label="Номер счётчика"
              hint="Только цифры. Пусто — счётчик на сайт не подключается."
              className="max-w-xs flex-1"
            >
              <input
                className="field tnum"
                value={s.yandexMetrikaId}
                onChange={(e) => set('yandexMetrikaId', e.target.value.replace(/\D/g, ''))}
                placeholder="98765432"
              />
            </Field>
            {s.yandexMetrikaId && (
              <a
                href={'https://metrika.yandex.ru/dashboard?id=' + s.yandexMetrikaId}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3.5 font-display text-sm font-medium hover:bg-sand"
              >
                <BarChart3 aria-hidden className="size-4" />
                Открыть отчёты Метрики
              </a>
            )}
          </div>
          <p className="mt-4 max-w-2xl text-[13px] text-subtle">
            Счётчик подключается на сайт автоматически, вместе с целями: отправка заявки, открытие
            формы, расчёт в калькуляторе, клик по телефону. Своя статистика в разделе «Сводка»
            работает независимо и остаётся, даже если Метрику отключить.
          </p>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            <Save aria-hidden className="size-4" />
            Сохранить настройки
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="mb-1 font-display text-lg font-semibold">Города и коэффициенты</h2>
        <p className="mb-4 max-w-2xl text-sm text-subtle">
          Все цены в базе хранятся для первого города. Для остальных умножаются на коэффициент — так
          прайс правится в одном месте.
        </p>
        <CollectionEditor
          endpoint="/admin/regions"
          textId
          addLabel="Новый город"
          blank={{ k: 1, active: 1 }}
          fields={[
            { name: 'name', label: 'Название', required: true, hint: 'Тюмень' },
            { name: 'name_in', label: 'В предложном падеже', hint: 'в Тюмени' },
            { name: 'k', label: 'Коэффициент к ценам', type: 'number', hint: '1 — базовый город' },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.name)}
          subtitle={(r) => 'коэффициент ×' + String(r.k)}
        />
      </div>

      <PasswordCard />
    </>
  )
}

/** Подсказка с длиной: у поисковиков она реально ограничена. */
function counter(value: string | undefined, limit: number, hint: string) {
  const len = (value ?? '').length
  const over = len > limit
  return (
    <span className={over ? 'text-warn' : undefined}>
      {hint} · {len}/{limit}
      {over ? ' — длинновато' : ''}
    </span>
  )
}

function PasswordCard() {
  const [form, setForm] = useState({ current: '', next: '', repeat: '' })
  const [busy, setBusy] = useState(false)
  const { notify } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.next !== form.repeat) return notify('Новые пароли не совпадают', 'bad')
    setBusy(true)
    try {
      await api.post('/admin/password', { current: form.current, next: form.next })
      setForm({ current: '', next: '', repeat: '' })
      notify('Пароль изменён')
    } catch (err) {
      notify((err as Error).message, 'bad')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Смена пароля" className="mt-8">
      <form onSubmit={submit} className="grid max-w-2xl gap-4 sm:grid-cols-3">
        <Field label="Текущий пароль">
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            required
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
          />
        </Field>
        <Field label="Новый" hint="Минимум 8 символов">
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            required
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
          />
        </Field>
        <Field label="Ещё раз">
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            required
            value={form.repeat}
            onChange={(e) => setForm({ ...form, repeat: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" variant="dark" loading={busy}>
            <KeyRound aria-hidden className="size-4" />
            Сменить пароль
          </Button>
        </div>
      </form>
    </Card>
  )
}

function parseList(raw: string | undefined): string[] {
  try {
    const v = JSON.parse(raw || '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

const splitList = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
