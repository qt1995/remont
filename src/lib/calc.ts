import type { SiteContent } from '@/lib/content'

export type Tariff = SiteContent['tariffs'][number]
export type PropertyType = Tariff['property']
export type MaterialsMode = 'own' | 'ours'
export type ExtraId = 'design' | 'furniture' | 'warmFloor' | 'smartLight'

export type CalcInput = {
  tariffId: string
  area: number
  rooms: number
  bathrooms: number
  materials: MaterialsMode
  extras: ExtraId[]
  regionK: number
  furnishingPerM2: number
}

export type CalcResult = {
  tariff: Tariff
  works: number
  materials: number
  extras: { id: ExtraId; label: string; sum: number }[]
  extrasTotal: number
  total: number
  min: number
  max: number
  perM2: number
  days: number
}

export const EXTRAS: { id: ExtraId; label: string; hint: string; perM2?: number; fixed?: number }[] = [
  {
    id: 'design',
    label: 'Дизайн-проект',
    hint: 'Планировка, 3D-визуализация, рабочие чертежи',
    perM2: 1500,
  },
  {
    id: 'furniture',
    label: 'Мебель и комплектация',
    hint: 'Подбор, закупка, доставка и сборка «под ключ»',
  },
  {
    id: 'warmFloor',
    label: 'Тёплые полы',
    hint: 'Санузлы и кухня, электрический контур с терморегулятором',
    fixed: 26000,
  },
  {
    id: 'smartLight',
    label: 'Сценарный свет',
    hint: 'Диммеры, подсветка ниш, управление со смартфона',
    perM2: 1200,
  },
]

export function tariffsFor(tariffs: Tariff[], property: PropertyType) {
  return tariffs.filter((t) => t.property === property)
}

export function calculate(tariffs: Tariff[], input: CalcInput): CalcResult | null {
  const tariff = tariffs.find((t) => t.id === input.tariffId)
  if (!tariff) return null

  const { area, rooms, bathrooms, regionK } = input

  // Больше комнат и санузлов на ту же площадь — больше стен, дверей и мокрых точек.
  const complexity = 1 + Math.max(0, rooms - 1) * 0.02 + Math.max(0, bathrooms - 1) * 0.06

  const works = tariff.pricePerM2 * area * complexity * regionK

  const materials =
    tariff.withMaterials || input.materials === 'own' ? 0 : tariff.materialsPerM2 * area * regionK

  const extras = input.extras.map((id) => {
    const def = EXTRAS.find((e) => e.id === id)!
    // Цена комплектации задаётся в админке вместе с самой опцией
    const perM2 = id === 'furniture' ? input.furnishingPerM2 : (def.perM2 ?? 0)
    const sum = perM2 ? perM2 * area * regionK : (def.fixed ?? 0) * bathrooms * regionK
    return { id, label: def.label, sum }
  })
  const extrasTotal = extras.reduce((acc, e) => acc + e.sum, 0)

  const total = works + materials + extrasTotal

  // Срок растёт от площади (до потолка тарифа) и от количества «мокрых» зон.
  const days = Math.round(
    tariff.termFrom +
      Math.min(1, area / 80) * (tariff.termTo - tariff.termFrom) +
      (bathrooms - 1) * 7,
  )

  return {
    tariff,
    works,
    materials,
    extras,
    extrasTotal,
    total,
    min: total * 0.93,
    max: total * 1.12,
    perM2: total / area,
    days: Math.min(days, tariff.termTo + 60),
  }
}
