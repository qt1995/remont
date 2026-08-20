export type Work = {
  id: string
  title: string
  address: string
  type: 'new' | 'old' | 'design'
  typeLabel: string
  area: number
  days: number
  /** Итоговая стоимость в Тюмени, без региональной наценки. */
  budget: number
  style: string
  image: string
  scope: string[]
}

export const works: Work[] = [
  {
    id: 'w1',
    title: 'Двушка в новостройке',
    address: 'TODO адрес объекта',
    type: 'new',
    typeLabel: 'Новостройка',
    area: 58,
    days: 72,
    budget: 1_180_000,
    style: 'Современный минимализм',
    image: '/portfolio/work-1.svg',
    scope: ['Под ключ с материалами', 'Кухня-гостиная', 'Санузел с инсталляцией'],
  },
  {
    id: 'w2',
    title: 'Однушка под сдачу',
    address: 'TODO адрес',
    type: 'new',
    typeLabel: 'Новостройка',
    area: 36,
    days: 45,
    budget: 690_000,
    style: 'Светлый скандинавский',
    image: '/portfolio/work-2.svg',
    scope: ['Под ключ', 'Ламинат и покраска', 'Комплектация мебелью'],
  },
  {
    id: 'w3',
    title: 'Сталинка после капремонта',
    address: 'TODO адрес',
    type: 'old',
    typeLabel: 'Вторичка',
    area: 74,
    days: 105,
    budget: 1_940_000,
    style: 'Классика с лепниной',
    image: '/portfolio/work-3.svg',
    scope: ['Капитальный ремонт', 'Полная замена коммуникаций', 'Реставрация окон'],
  },
  {
    id: 'w4',
    title: 'Трёшка для семьи',
    address: 'TODO адрес',
    type: 'old',
    typeLabel: 'Вторичка',
    area: 82,
    days: 96,
    budget: 1_620_000,
    style: 'Тёплый современный',
    image: '/portfolio/work-4.svg',
    scope: ['Перепланировка с согласованием', 'Два санузла', 'Тёплые полы'],
  },
  {
    id: 'w5',
    title: 'Студия 26 м²',
    address: 'TODO адрес',
    type: 'design',
    typeLabel: 'Дизайн-проект',
    area: 26,
    days: 38,
    budget: 540_000,
    style: 'Компактный лофт',
    image: '/portfolio/work-5.svg',
    scope: ['Дизайн-проект', 'Мебель на заказ', 'Сценарный свет'],
  },
  {
    id: 'w6',
    title: 'Пентхаус с террасой',
    address: 'TODO адрес',
    type: 'design',
    typeLabel: 'Дизайн-проект',
    area: 118,
    days: 150,
    budget: 4_260_000,
    style: 'Тихая роскошь',
    image: '/portfolio/work-6.svg',
    scope: ['Авторский надзор', 'Скрытые двери', 'Умный дом'],
  },
]

export const workFilters = [
  { id: 'all', label: 'Все работы' },
  { id: 'new', label: 'Новостройки' },
  { id: 'old', label: 'Вторичка' },
  { id: 'design', label: 'Дизайн-проекты' },
] as const
