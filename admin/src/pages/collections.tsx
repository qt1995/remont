import { useState, type ReactNode } from 'react'
import { CollectionEditor, type ChildDef, type FieldDef } from '@/components/CollectionEditor'
import { UNIT_SUGGESTIONS } from '@/components/RowTable'
import { SettingsForm } from '@/components/SettingsForm'
import { PageHeader } from '@/components/ui'
import type { Row } from '@/lib/api'

const money = (v: unknown) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(Number(v) || 0)) + ' ₽'

/** Простые вкладки внутри страницы — чтобы не плодить пункты в меню. */
function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-pressed={value === t.id}
          className={
            'min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium transition-colors ' +
            (value === t.id
              ? 'border-navy bg-navy text-white'
              : 'border-line bg-white text-navy-600 hover:bg-sand')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────────  Тарифы  ───────────────────────── */

const tariffFields: FieldDef[] = [
  {
    name: 'property',
    label: 'Тип квартиры',
    type: 'select',
    options: [
      { value: 'new', label: 'Новостройка' },
      { value: 'old', label: 'Вторичка' },
    ],
  },
  { name: 'name', label: 'Название тарифа', required: true },
  { name: 'summary', label: 'Короткое описание', type: 'textarea', hint: 'Три строки на карточке' },
  { name: 'price_per_m2', label: 'Цена за м², ₽', type: 'number', hint: 'База по первому городу' },
  {
    name: 'price_from',
    label: 'Показывать «от» перед ценой',
    type: 'bool',
    hint: 'Так честнее: итог зависит от состояния квартиры',
  },
  {
    name: 'materials_per_m2',
    label: 'Черновые материалы за м², ₽',
    type: 'number',
    hint: 'Ими считает калькулятор, если клиент выбрал «закупаете вы»',
  },
  { name: 'with_materials', label: 'Материалы включены в цену', type: 'bool' },
  {
    name: 'materials_note',
    label: 'Оговорка про материалы',
    hint: 'Короткая строка на карточке: например «черновые материалы считаются отдельно»',
    full: true,
  },
  { name: 'term_from', label: 'Срок от, дней', type: 'number' },
  { name: 'term_to', label: 'Срок до, дней', type: 'number' },
  { name: 'popular', label: 'Отметить «чаще всего берут»', type: 'bool' },
  { name: 'active', label: 'Показывать на сайте', type: 'bool' },
]

const tariffChild: ChildDef = {
  label: 'Что входит и чего нет',
  addLabel: 'Добавить пункт',
  hint: 'Перетаскивайте за точки слева, вставляйте строку плюсиком между строк, выделяйте важное жирным.',
  formatting: true,
  columns: [
    { name: 'text', label: 'Пункт', width: '1fr' },
    {
      name: 'kind',
      label: 'Тип',
      type: 'select',
      width: '150px',
      options: [
        { value: 'include', label: 'Входит' },
        { value: 'exclude', label: 'Не входит' },
      ],
    },
  ],
}

const TARIFF_TABS = [
  { id: 'list', label: 'Тарифы' },
  { id: 'notes', label: 'Что считается отдельно' },
] as const

export function TariffsPage() {
  const [tab, setTab] = useState<(typeof TARIFF_TABS)[number]['id']>('list')

  return (
    <>
      <PageHeader
        title="Тарифы"
        description="Пакеты ремонта и сноска под ними. Цены задаются базой по первому городу — для остальных пересчитываются коэффициентом из «Настроек»."
      />
      <Tabs tabs={TARIFF_TABS} value={tab} onChange={setTab} />

      {tab === 'list' && (
        <CollectionEditor
          endpoint="/admin/tariffs"
          textId
          fields={tariffFields}
          child={tariffChild}
          addLabel="Новый тариф"
          blank={{ property: 'new', term_from: 30, term_to: 60, active: 1, price_from: 1 }}
          title={(r) => String(r.name)}
          subtitle={(r) =>
            (r.property === 'new' ? 'Новостройка' : 'Вторичка') +
            ' · ' +
            (r.price_from ? 'от ' : '') +
            money(r.price_per_m2) +
            '/м² · ' +
            String(r.term_from) +
            '–' +
            String(r.term_to) +
            ' дн.'
          }
        />
      )}

      {tab === 'notes' && (
        <CollectionEditor
          endpoint="/admin/tariff-notes"
          addLabel="Новый пункт"
          emptyHint="Сюда выносим всё, что не входит в цену за метр: черновые и чистовые материалы, дизайн-проект."
          fields={[
            { name: 'title', label: 'Название', required: true, hint: 'Например: Черновые материалы' },
            { name: 'value', label: 'Сумма', hint: 'Например: в среднем 5 000 ₽/м²' },
            { name: 'note', label: 'Пояснение', type: 'textarea' },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.title)}
          subtitle={(r) => String(r.value)}
        />
      )}
    </>
  )
}

/* ─────────────────────────  Прайс  ───────────────────────── */

export function PricePage() {
  return (
    <>
      <PageHeader
        title="Прайс на работы"
        description="Группы работ и позиции внутри них. Скрытая строка не показывается на сайте, но попадает в PDF — так витрина остаётся короткой, а полный прайс уходит по кнопке."
      />
      <CollectionEditor
        endpoint="/admin/price-groups"
        textId
        addLabel="Новая группа"
        fields={[
          { name: 'name', label: 'Название группы', required: true },
          { name: 'hint', label: 'Подпись под названием' },
          {
            name: 'visible_limit',
            label: 'Показывать на сайте, строк',
            type: 'number',
            hint: '0 — брать общее значение из «Настроек». Остальные строки уйдут в PDF.',
          },
          { name: 'active', label: 'Показывать на сайте', type: 'bool' },
        ]}
        child={{
          label: 'Позиции прайса',
          addLabel: 'Добавить позицию',
          hint: 'Перетаскивайте строки за точки, вставляйте новые плюсиком между строк. Кнопка справа прячет строку с сайта, оставляя её в PDF.',
          formatting: true,
          hideable: true,
          commentField: 'comment',
          columns: [
            { name: 'name', label: 'Вид работ', width: '1fr' },
            { name: 'price', label: 'Цена, ₽', type: 'number', width: '120px' },
            {
              name: 'unit',
              label: 'Единица',
              type: 'unit',
              width: '170px',
              suggestions: UNIT_SUGGESTIONS,
              placeholder: 'м², шт, мешок…',
            },
          ],
        }}
        title={(r) => String(r.name)}
        subtitle={(r) => {
          const items = (r.items as Row[] | undefined) ?? []
          const shown = items.filter((i) => i.active).length
          return items.length + ' позиций, на сайте ' + shown
        }}
      />
    </>
  )
}

/* ─────────────────────────  Работы  ───────────────────────── */

export function WorksPage() {
  return (
    <>
      <PageHeader
        title="Наши работы"
        description="Сданные объекты. Площадь, срок и бюджет показываются на карточке — это главный аргумент раздела."
      />
      <CollectionEditor
        endpoint="/admin/works"
        addLabel="Новый объект"
        blank={{ type: 'new', type_label: 'Новостройка', active: 1 }}
        fields={[
          { name: 'title', label: 'Название', required: true },
          { name: 'style', label: 'Стиль' },
          {
            name: 'type',
            label: 'Раздел фильтра',
            type: 'select',
            options: [
              { value: 'new', label: 'Новостройки' },
              { value: 'old', label: 'Вторичка' },
              { value: 'design', label: 'Дизайн-проекты' },
            ],
          },
          { name: 'type_label', label: 'Подпись на фото', hint: 'Например: Новостройка' },
          { name: 'area', label: 'Площадь, м²', type: 'number' },
          { name: 'days', label: 'Срок, дней', type: 'number' },
          { name: 'budget', label: 'Бюджет, ₽', type: 'number', hint: 'База по первому городу' },
          { name: 'address', label: 'Адрес объекта', hint: 'Показывается только в админке' },
          { name: 'image', label: 'Фотография', type: 'image' },
          { name: 'active', label: 'Показывать на сайте', type: 'bool' },
        ]}
        child={{
          label: 'Что делали',
          addLabel: 'Добавить пункт',
          columns: [{ name: 'text', label: 'Пункт', width: '1fr' }],
        }}
        title={(r) => String(r.title)}
        subtitle={(r) => String(r.area) + ' м² · ' + String(r.days) + ' дн. · ' + money(r.budget)}
      />
    </>
  )
}

/* ─────────────────────────  Калькулятор  ───────────────────────── */

const CALC_TABS = [
  { id: 'rooms', label: 'Комнаты и санузлы' },
  { id: 'extras', label: 'Дополнительные опции' },
  { id: 'area', label: 'Зависимость от объёма' },
] as const

export function CalculatorPage() {
  const [tab, setTab] = useState<(typeof CALC_TABS)[number]['id']>('rooms')

  return (
    <>
      <PageHeader
        title="Калькулятор"
        description="Из чего складывается расчёт на сайте. Коэффициенты за комнаты и санузлы — в «Настройках»."
      />
      <Tabs tabs={CALC_TABS} value={tab} onChange={setTab} />

      {tab === 'rooms' && (
        <SettingsForm
          title="Коэффициенты за комнаты и санузлы"
          description="На той же площади каждая лишняя комната — это ещё стены, углы и двери, а каждый лишний санузел — ещё одна мокрая зона. Здесь задаётся, насколько это удорожает работы. Считается от первой комнаты и первого санузла: при 3 комнатах и надбавке 2% работы дорожают на 4%. Что сработало, видно в расчёте на сайте."
          fields={[
            {
              name: 'calcRoomK',
              label: 'Надбавка за комнату, %',
              type: 'number',
              hint: 'За каждую комнату сверх первой',
            },
            {
              name: 'calcBathK',
              label: 'Надбавка за санузел, %',
              type: 'number',
              hint: 'За каждый санузел сверх первого',
            },
            {
              name: 'calcSpread',
              label: 'Ширина вилки, %',
              type: 'number',
              hint: 'Насколько верхняя граница выше расчёта. 0 — показывать одну сумму',
            },
            {
              name: 'calcMaterialsLabel',
              label: 'Как называть материалы',
              hint: 'Заголовок шага в калькуляторе',
            },
            {
              name: 'calcMaterialsHint',
              label: 'Пояснение под материалами',
              type: 'textarea',
            },
          ]}
        />
      )}

      {tab === 'extras' && (
        <CollectionEditor
          endpoint="/admin/calc-extras"
          textId
          addLabel="Новая опция"
          blank={{ kind: 'per_m2', active: 1 }}
          emptyHint="Дизайн-проект, кухня, тёплые полы — всё, что клиент может добавить к ремонту."
          fields={[
            { name: 'label', label: 'Название', required: true },
            { name: 'hint', label: 'Пояснение', type: 'textarea' },
            {
              name: 'kind',
              label: 'Как считать',
              type: 'select',
              options: [
                { value: 'per_m2', label: 'За квадратный метр' },
                { value: 'fixed', label: 'Фиксированной суммой' },
                { value: 'per_bath', label: 'За каждый санузел' },
              ],
            },
            { name: 'amount', label: 'Сумма, ₽', type: 'number' },
            { name: 'active', label: 'Показывать в калькуляторе', type: 'bool' },
          ]}
          title={(r) => String(r.label)}
          subtitle={(r) =>
            money(r.amount) +
            (r.kind === 'per_m2' ? ' за м²' : r.kind === 'per_bath' ? ' за санузел' : ' фиксированно')
          }
        />
      )}

      {tab === 'area' && (
        <>
          <p className="mb-4 max-w-3xl rounded-xl border border-line bg-white p-4 text-[13px] leading-relaxed text-subtle">
            Чем больше площадь, тем дешевле обходится метр: выезды, доставка и организация те же.
            Ступень применяется, когда площадь больше или равна указанной. Коэффициент 1 — без
            изменений, 1.1 — дороже на 10%, 0.95 — дешевле на 5%. В расчёте на сайте видно, какая
            ступень сработала.
          </p>
          <CollectionEditor
            endpoint="/admin/area-tiers"
            addLabel="Новая ступень"
            fields={[
              { name: 'area_from', label: 'Площадь от, м²', type: 'number' },
              { name: 'k', label: 'Коэффициент', type: 'number', hint: '1 — базовая цена' },
              { name: 'label', label: 'Как показать в расчёте', full: true },
            ]}
            title={(r) => 'от ' + String(r.area_from) + ' м²'}
            subtitle={(r) => 'коэффициент ×' + String(r.k) + ' — ' + String(r.label)}
          />
        </>
      )}
    </>
  )
}

/* ─────────────────────────  Тексты сайта  ───────────────────────── */

const TABS = [
  { id: 'hero', label: 'Первый экран' },
  { id: 'stats', label: 'Счётчики' },
  { id: 'stages', label: 'Слайдер этапов' },
  { id: 'pains', label: 'Боли клиентов' },
  { id: 'process', label: 'Этапы работы' },
  { id: 'guarantees', label: 'Гарантии' },
  { id: 'promos', label: 'Акции' },
  { id: 'partners', label: 'Партнёры' },
  { id: 'reviews', label: 'Отзывы' },
  { id: 'video', label: 'Видеоотзывы' },
  { id: 'faq', label: 'Вопросы' },
] as const

export function ContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('hero')

  return (
    <>
      <PageHeader
        title="Тексты сайта"
        description="Всё, что читает посетитель между ценами и формой заявки."
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'hero' && (
        <CollectionEditor
          endpoint="/admin/hero-features"
          addLabel="Новая плашка"
          emptyHint="Четыре коротких обещания под первым экраном."
          fields={[
            { name: 'title', label: 'Заголовок', required: true },
            { name: 'text', label: 'Пояснение', type: 'textarea' },
            {
              name: 'icon',
              label: 'Значок',
              type: 'select',
              options: [
                { value: 'file', label: 'Документ' },
                { value: 'clock', label: 'Часы' },
                { value: 'shield', label: 'Щит' },
                { value: 'ruler', label: 'Линейка' },
                { value: 'wallet', label: 'Кошелёк' },
                { value: 'box', label: 'Коробка' },
                { value: 'check', label: 'Галочка' },
              ],
            },
          ]}
          title={(r) => String(r.title)}
          subtitle={(r) => String(r.text)}
        />
      )}

      {tab === 'stats' && (
        <CollectionEditor
          endpoint="/admin/stats"
          addLabel="Новый счётчик"
          fields={[
            {
              name: 'value',
              label: 'Число',
              hint: 'Только цифры — оно набирается анимацией. Слова пишите в приписку.',
            },
            { name: 'suffix', label: 'Приписка', hint: 'Например: +, ₽, « года»' },
            { name: 'label', label: 'Подпись', type: 'textarea' },
          ]}
          title={(r) => String(r.value) + String(r.suffix)}
          subtitle={(r) => String(r.label)}
        />
      )}

      {tab === 'stages' && (
        <CollectionEditor
          endpoint="/admin/stage-shots"
          addLabel="Новый этап"
          emptyHint="Слайдер показывает переход между соседними кадрами, поэтому этапов должно быть минимум три."
          fields={[
            { name: 'name', label: 'Название этапа', required: true },
            { name: 'price', label: 'Подпись с ценой', hint: 'Например: от 4 900 ₽/м²' },
            { name: 'caption', label: 'Что входит', type: 'textarea' },
            {
              name: 'image',
              label: 'Кадр комнаты',
              type: 'image',
              hint: 'Снимайте со штатива с одной точки — тогда слайдер совпадёт пиксель в пиксель',
            },
          ]}
          title={(r) => String(r.name)}
          subtitle={(r) => String(r.price)}
        />
      )}

      {tab === 'pains' && (
        <CollectionEditor
          endpoint="/admin/pains"
          addLabel="Новая боль"
          fields={[
            { name: 'problem', label: 'Чего боится клиент', type: 'textarea', required: true },
            { name: 'solution', label: 'Как мы это закрываем', type: 'textarea', required: true },
          ]}
          title={(r) => String(r.problem)}
          subtitle={(r) => String(r.solution)}
        />
      )}

      {tab === 'process' && (
        <CollectionEditor
          endpoint="/admin/process-steps"
          addLabel="Новый этап"
          fields={[
            { name: 'n', label: 'Номер', hint: 'Например 01' },
            { name: 'title', label: 'Название', required: true },
            { name: 'duration', label: 'Сколько занимает' },
            { name: 'text', label: 'Описание', type: 'textarea' },
          ]}
          title={(r) => String(r.n) + '. ' + String(r.title)}
          subtitle={(r) => String(r.duration)}
        />
      )}

      {tab === 'guarantees' && (
        <CollectionEditor
          endpoint="/admin/guarantees"
          addLabel="Новая гарантия"
          fields={[
            { name: 'title', label: 'Заголовок', required: true },
            { name: 'text', label: 'Описание', type: 'textarea' },
          ]}
          title={(r) => String(r.title)}
          subtitle={(r) => String(r.text)}
        />
      )}

      {tab === 'promos' && (
        <CollectionEditor
          endpoint="/admin/promos"
          addLabel="Новая акция"
          fields={[
            { name: 'title', label: 'Название', required: true },
            { name: 'badge', label: 'Метка', hint: 'Например: до конца месяца' },
            { name: 'text', label: 'Условия', type: 'textarea' },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.title)}
          subtitle={(r) => String(r.badge)}
        />
      )}

      {tab === 'partners' && (
        <CollectionEditor
          endpoint="/admin/partners"
          addLabel="Новый партнёр"
          emptyHint="Поставщики материалов, салоны, фабрики — всё, что показывает, что закупка идёт не со случайного рынка."
          fields={[
            { name: 'name', label: 'Название', required: true },
            { name: 'note', label: 'Чем полезен', hint: 'Например: склад в городе, отгрузка день в день' },
            { name: 'url', label: 'Ссылка на сайт' },
            { name: 'logo', label: 'Логотип', type: 'image' },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.name)}
          subtitle={(r) => String(r.note)}
        />
      )}

      {tab === 'reviews' && (
        <CollectionEditor
          endpoint="/admin/reviews-text"
          addLabel="Новый отзыв"
          blank={{ rating: 5, active: 1 }}
          fields={[
            { name: 'name', label: 'Имя', required: true },
            { name: 'object', label: 'Объект', hint: 'Например: Двушка 58 м², новостройка' },
            { name: 'date', label: 'Когда', hint: 'Например: Март 2026' },
            { name: 'rating', label: 'Оценка, 1–5', type: 'number' },
            { name: 'text', label: 'Текст отзыва', type: 'textarea', required: true },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.name)}
          subtitle={(r) => String(r.object)}
        />
      )}

      {tab === 'video' && (
        <CollectionEditor
          endpoint="/admin/reviews-video"
          addLabel="Новое видео"
          fields={[
            { name: 'name', label: 'Имя', required: true },
            { name: 'object', label: 'Объект' },
            { name: 'duration', label: 'Длительность', hint: 'Например: 2:14' },
            { name: 'url', label: 'Ссылка на видео', hint: 'YouTube, VK Видео или прямой файл' },
            { name: 'poster', label: 'Обложка', type: 'image' },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.name)}
          subtitle={(r) => String(r.object) + (r.url ? '' : ' · видео не загружено')}
        />
      )}

      {tab === 'faq' && (
        <CollectionEditor
          endpoint="/admin/faq"
          addLabel="Новый вопрос"
          fields={[
            { name: 'q', label: 'Вопрос', type: 'textarea', required: true },
            { name: 'a', label: 'Ответ', type: 'textarea', required: true },
            { name: 'active', label: 'Показывать на сайте', type: 'bool' },
          ]}
          title={(r) => String(r.q)}
          subtitle={(r) => String(r.a)}
        />
      )}
    </>
  )
}

export type { ReactNode }
