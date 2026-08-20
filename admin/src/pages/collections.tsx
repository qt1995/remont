import { useState } from 'react'
import { CollectionEditor, type ChildDef, type FieldDef } from '@/components/CollectionEditor'
import { PageHeader } from '@/components/ui'
import type { Row } from '@/lib/api'

const money = (v: unknown) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(Number(v) || 0)) + ' ₽'

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
  { name: 'price_per_m2', label: 'Цена за м², ₽', type: 'number', hint: 'База по Тюмени' },
  {
    name: 'materials_per_m2',
    label: 'Материалы за м², ₽',
    type: 'number',
    hint: 'Используется калькулятором, если клиент выбрал «закупаете вы»',
  },
  { name: 'with_materials', label: 'Материалы включены в цену', type: 'bool' },
  { name: 'term_from', label: 'Срок от, дней', type: 'number' },
  { name: 'term_to', label: 'Срок до, дней', type: 'number' },
  { name: 'popular', label: 'Отметить «чаще всего берут»', type: 'bool' },
  { name: 'active', label: 'Показывать на сайте', type: 'bool' },
]

const tariffChild: ChildDef = {
  label: 'Что входит и чего нет',
  addLabel: 'Добавить пункт',
  fields: [
    { name: 'text', label: 'Пункт' },
    {
      name: 'kind',
      label: 'Тип',
      type: 'select',
      options: [
        { value: 'include', label: 'Входит' },
        { value: 'exclude', label: 'Не входит' },
      ],
    },
  ],
}

export function TariffsPage() {
  return (
    <>
      <PageHeader
        title="Тарифы"
        description="Пакеты ремонта. Цены задаются базой по Тюмени — для других городов пересчитываются коэффициентом из раздела «Настройки»."
      />
      <CollectionEditor
        endpoint="/admin/tariffs"
        textId
        fields={tariffFields}
        child={tariffChild}
        addLabel="Новый тариф"
        blank={{ property: 'new', term_from: 30, term_to: 60, active: 1 }}
        title={(r) => String(r.name)}
        subtitle={(r) =>
          (r.property === 'new' ? 'Новостройка' : 'Вторичка') +
          ' · ' +
          money(r.price_per_m2) +
          '/м² · ' +
          String(r.term_from) +
          '–' +
          String(r.term_to) +
          ' дн.'
        }
      />
    </>
  )
}

/* ─────────────────────────  Прайс  ───────────────────────── */

export function PricePage() {
  return (
    <>
      <PageHeader
        title="Прайс на работы"
        description="Группы работ и позиции внутри них. Из этих же строк собирается смета, поэтому цены лучше держать честными."
      />
      <CollectionEditor
        endpoint="/admin/price-groups"
        textId
        addLabel="Новая группа"
        fields={[
          { name: 'name', label: 'Название группы', required: true },
          { name: 'hint', label: 'Подпись под названием' },
          { name: 'active', label: 'Показывать на сайте', type: 'bool' },
        ]}
        child={{
          label: 'Позиции прайса',
          addLabel: 'Добавить позицию',
          fields: [
            { name: 'name', label: 'Вид работ' },
            { name: 'price', label: 'Цена, ₽', type: 'number' },
            { name: 'unit', label: 'Единица' },
          ],
        }}
        title={(r) => String(r.name)}
        subtitle={(r) => String((r.items as Row[] | undefined)?.length ?? 0) + ' позиций'}
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
          { name: 'budget', label: 'Бюджет, ₽', type: 'number', hint: 'База по Тюмени' },
          { name: 'address', label: 'Адрес объекта', hint: 'Показывается только в админке' },
          { name: 'image', label: 'Фотография', type: 'image' },
          { name: 'active', label: 'Показывать на сайте', type: 'bool' },
        ]}
        child={{
          label: 'Что делали',
          addLabel: 'Добавить пункт',
          fields: [{ name: 'text', label: 'Пункт' }],
        }}
        title={(r) => String(r.title)}
        subtitle={(r) => String(r.area) + ' м² · ' + String(r.days) + ' дн. · ' + money(r.budget)}
      />
    </>
  )
}

/* ─────────────────────────  Тексты сайта  ───────────────────────── */

const TABS = [
  { id: 'stages', label: 'Слайдер этапов' },
  { id: 'stats', label: 'Счётчики' },
  { id: 'pains', label: 'Боли клиентов' },
  { id: 'process', label: 'Этапы работы' },
  { id: 'guarantees', label: 'Гарантии' },
  { id: 'promos', label: 'Акции' },
  { id: 'reviews', label: 'Отзывы' },
  { id: 'video', label: 'Видеоотзывы' },
  { id: 'faq', label: 'Вопросы' },
] as const

export function ContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('stages')

  return (
    <>
      <PageHeader
        title="Тексты сайта"
        description="Всё, что читает посетитель между ценами и формой заявки."
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={
              'min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium transition-colors ' +
              (tab === t.id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy-600 hover:bg-sand')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stages' && (
        <CollectionEditor
          endpoint="/admin/stage-shots"
          addLabel="Новый этап"
          emptyHint="Слайдер показывает переход между соседними кадрами, поэтому этапов должно быть минимум три."
          fields={[
            { name: 'name', label: 'Название этапа', required: true },
            { name: 'price', label: 'Подпись с ценой', hint: 'Например: от 4 900 ₽/м²' },
            { name: 'caption', label: 'Что входит', type: 'textarea' },
            { name: 'image', label: 'Кадр комнаты', type: 'image', hint: 'Снимайте со штатива с одной точки — тогда слайдер совпадёт пиксель в пиксель' },
          ]}
          title={(r) => String(r.name)}
          subtitle={(r) => String(r.price)}
        />
      )}

      {tab === 'stats' && (
        <CollectionEditor
          endpoint="/admin/stats"
          addLabel="Новый счётчик"
          fields={[
            { name: 'value', label: 'Число', hint: 'Только цифры — оно набирается анимацией' },
            { name: 'suffix', label: 'Приписка', hint: 'Например: + или  лет' },
            { name: 'label', label: 'Подпись', type: 'textarea' },
          ]}
          title={(r) => String(r.value) + String(r.suffix)}
          subtitle={(r) => String(r.label)}
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
