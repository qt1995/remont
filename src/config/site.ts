/**
 * Единая точка правки контактов и бренда.
 * Пока заглушки — заменить на реальные данные, когда появятся.
 */

export const site = {
  brand: 'ПРО Комфорт',
  tagline: 'Ремонт квартир под ключ',
  legal: 'ИП Иванов И. И.', // TODO
  inn: '000000000000', // TODO

  phone: '+7 (000) 000-00-00', // TODO
  phoneHref: 'tel:+70000000000', // TODO
  email: 'hello@example.ru', // TODO
  telegram: 'https://t.me/example', // TODO
  whatsapp: 'https://wa.me/70000000000', // TODO

  /** Офиса пока нет — блок «Контакты» показывает это честно, а не выдумывает адрес. */
  office: null as null | { address: string; hours: string; mapUrl: string },

  /** Куда уходят заявки. Пустая строка → заявка пишется в консоль и localStorage. */
  leadEndpoint: import.meta.env.VITE_LEAD_ENDPOINT ?? '',
} as const

export type RegionId = 'tyumen' | 'moscow'

export type Region = {
  id: RegionId
  name: string
  nameIn: string
  /** Множитель к базовому прайсу (база = Тюмень). */
  k: number
  phone: string
  phoneHref: string
}

export const regions: Record<RegionId, Region> = {
  tyumen: {
    id: 'tyumen',
    name: 'Тюмень',
    nameIn: 'Тюмени',
    k: 1,
    phone: site.phone,
    phoneHref: site.phoneHref,
  },
  moscow: {
    id: 'moscow',
    name: 'Москва',
    nameIn: 'Москве',
    k: 1.75, // TODO: уточнить коэффициент по факту
    phone: site.phone,
    phoneHref: site.phoneHref,
  },
}

export const regionList = Object.values(regions)
export const defaultRegion: RegionId = 'tyumen'

export const stats = [
  { value: '12', suffix: ' лет', label: 'на рынке ремонта' },
  { value: '480', suffix: '+', label: 'сданных объектов' },
  { value: '0', suffix: ' ₽', label: 'доплат сверх сметы' },
  { value: '5', suffix: ' лет', label: 'гарантия на работы' },
] as const
