import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { furnishingAddon as fallbackFurnishing, tariffs as fallbackTariffs } from '@/data/tariffs'
import { priceGroups as fallbackPrice } from '@/data/priceList'
import { works as fallbackWorks } from '@/data/portfolio'
import {
  faq as fallbackFaq,
  guarantees as fallbackGuarantees,
  pains as fallbackPains,
  promos as fallbackPromos,
  stages as fallbackSteps,
  textReviews as fallbackTextReviews,
  videoReviews as fallbackVideoReviews,
} from '@/data/content'
import { regionList, site, stats as fallbackStats } from '@/config/site'
import { asset } from '@/lib/asset'

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export type SiteContent = {
  settings: {
    brand: string
    tagline: string
    legal: string
    inn: string
    phone: string
    email: string
    telegram: string
    whatsapp: string
    workHours: string
    office: { address: string; hours: string; mapUrl: string } | null
    yandexMetrikaId: string
    sampleArea: number
  }
  regions: { id: string; name: string; nameIn: string; k: number }[]
  stats: { value: string; suffix: string; label: string }[]
  tariffs: {
    id: string
    property: 'new' | 'old'
    name: string
    pricePerM2: number
    withMaterials: boolean
    materialsPerM2: number
    summary: string
    termFrom: number
    termTo: number
    popular: boolean
    includes: string[]
    excludes: string[]
  }[]
  furnishingAddon: { name: string; pricePerM2: number; summary: string; includes: string[] }
  priceGroups: {
    id: string
    name: string
    hint: string
    items: { name: string; price: number; unit: string; note?: string }[]
  }[]
  works: {
    id: string
    title: string
    address: string
    type: string
    typeLabel: string
    area: number
    days: number
    budget: number
    style: string
    image: string
    scope: string[]
  }[]
  stageShots: { name: string; caption: string; price: string; image: string }[]
  pains: { problem: string; solution: string }[]
  processSteps: { n: string; title: string; text: string; duration: string }[]
  guarantees: { title: string; text: string }[]
  promos: { title: string; text: string; badge: string }[]
  videoReviews: { id: string; name: string; object: string; duration: string; poster: string; url: string }[]
  textReviews: { name: string; object: string; date: string; rating: number; text: string }[]
  faq: { q: string; a: string }[]
}

/** Ставки материалов для встроенных данных — в базе они лежат у самого тарифа. */
const FALLBACK_MATERIALS: Record<string, number> = {
  'new-rough': 3500,
  'new-prefinish': 5200,
  'new-turnkey': 9500,
  'new-turnkey-materials': 0,
  'old-cosmetic': 3200,
  'old-capital': 7800,
  'old-euro': 11000,
}

/**
 * Данные, вшитые в сборку. Сайт работает на них, если API недоступен —
 * лендинг не должен падать из-за упавшего сервера админки.
 */
export const fallbackContent: SiteContent = {
  settings: {
    brand: site.brand,
    tagline: site.tagline,
    legal: site.legal,
    inn: site.inn,
    phone: site.phone,
    email: site.email,
    telegram: site.telegram,
    whatsapp: site.whatsapp,
    workHours: 'Пн–Сб, 9:00–20:00',
    office: site.office,
    yandexMetrikaId: '',
    sampleArea: 50,
  },
  regions: regionList.map((r) => ({ id: r.id, name: r.name, nameIn: r.nameIn, k: r.k })),
  stats: fallbackStats.map((s) => ({ value: s.value, suffix: s.suffix, label: s.label })),
  tariffs: fallbackTariffs.map((t) => ({
    id: t.id,
    property: t.property,
    name: t.name,
    pricePerM2: t.pricePerM2,
    withMaterials: !!t.withMaterials,
    materialsPerM2: FALLBACK_MATERIALS[t.id] ?? 0,
    summary: t.summary,
    termFrom: t.termFrom,
    termTo: t.termTo,
    popular: !!t.popular,
    includes: t.includes,
    excludes: t.excludes ?? [],
  })),
  furnishingAddon: {
    name: fallbackFurnishing.name,
    pricePerM2: fallbackFurnishing.pricePerM2,
    summary: fallbackFurnishing.summary,
    includes: fallbackFurnishing.includes,
  },
  priceGroups: fallbackPrice,
  works: fallbackWorks.map((w) => ({ ...w })),
  stageShots: [
    {
      name: 'Черновая',
      caption: 'Стены под штукатурку, стяжка, разводка электрики и сантехники.',
      price: 'от 4 900 ₽/м²',
      image: '/stages/1-draft.svg',
    },
    {
      name: 'Чистовая',
      caption: 'Финишная отделка, полы, двери, свет, сантехника. Можно заезжать.',
      price: 'от 9 900 ₽/м²',
      image: '/stages/2-finish.svg',
    },
    {
      name: 'С мебелью',
      caption: 'Подбор, закупка и сборка мебели, света и текстиля под дизайн-проект.',
      price: '+10 000 ₽/м²',
      image: '/stages/3-furnished.svg',
    },
  ],
  pains: fallbackPains,
  processSteps: fallbackSteps,
  guarantees: fallbackGuarantees,
  promos: fallbackPromos.map((p) => ({ ...p })),
  videoReviews: fallbackVideoReviews.map((v, i) => ({
    ...v,
    poster: '/portfolio/work-' + ((i % 6) + 1) + '.svg',
    url: '',
  })),
  textReviews: fallbackTextReviews.map((r) => ({ ...r })),
  faq: fallbackFaq,
}

const ContentContext = createContext<SiteContent>(fallbackContent)

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(fallbackContent)

  useEffect(() => {
    if (!API_URL) return
    let cancelled = false

    fetch(API_URL + '/api/content')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((data: SiteContent) => {
        if (!cancelled && data?.tariffs?.length) setContent(data)
      })
      .catch((e) => {
        // Сервер недоступен — остаёмся на вшитых данных, сайт продолжает работать
        console.info('[content] используем встроенные данные:', e.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export const useContent = () => useContext(ContentContext)

/** Ссылка на картинку: из админки, из папки сайта или внешняя. */
export function mediaUrl(path: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/uploads/')) return API_URL + path
  return asset(path)
}

export function useMedia() {
  return useMemo(() => mediaUrl, [])
}

