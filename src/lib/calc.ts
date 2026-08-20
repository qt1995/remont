import { tariffs, type PropertyType, type Tariff } from '@/data/tariffs'

export type MaterialsMode = 'own' | 'ours'
export type ExtraId = 'design' | 'furniture' | 'warmFloor' | 'smartLight'

export type CalcInput = {
  property: PropertyType
  tariffId: string
  area: number
  rooms: number
  bathrooms: number
  materials: MaterialsMode
  extras: ExtraId[]
  regionK: number
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

/** Ориентировочная стоимость материалов на м² под каждый уровень отделки. */
const MATERIALS_PER_M2: Record<string, number> = {
  'new-rough': 3500,
  'new-prefinish': 5200,
  'new-turnkey': 9500,
  'new-turnkey-materials': 0,
  'old-cosmetic': 3200,
  'old-capital': 7800,
  'old-euro': 11000,
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
    perM2: 10000,
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

export function tariffsFor(property: PropertyType) {
  return tariffs.filter((t) => t.property === property)
}

export function calculate(input: CalcInput): CalcResult | null {
  const tariff = tariffs.find((t) => t.id === input.tariffId)
  if (!tariff) return null

  const { area, rooms, bathrooms, regionK } = input

  // Больше комнат и санузлов на ту же площадь — больше стен, дверей и мокрых точек.
  const complexity = 1 + Math.max(0, rooms - 1) * 0.02 + Math.max(0, bathrooms - 1) * 0.06

  const works = tariff.pricePerM2 * area * complexity * regionK

  const materialsRate = MATERIALS_PER_M2[tariff.id] ?? 0
  const materials =
    tariff.withMaterials || input.materials === 'own' ? 0 : materialsRate * area * regionK

  const extras = input.extras.map((id) => {
    const def = EXTRAS.find((e) => e.id === id)!
    const sum = def.perM2 ? def.perM2 * area * regionK : (def.fixed ?? 0) * bathrooms * regionK
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
