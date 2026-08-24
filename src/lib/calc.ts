import type { SiteContent } from '@/lib/content'

export type Tariff = SiteContent['tariffs'][number]
export type PropertyType = Tariff['property']
export type MaterialsMode = 'own' | 'ours'
export type CalcExtra = SiteContent['calcExtras'][number]
export type AreaTier = SiteContent['areaTiers'][number]

export type CalcInput = {
  tariffId: string
  area: number
  rooms: number
  bathrooms: number
  materials: MaterialsMode
  extras: string[]
  regionK: number
  /** Насколько каждая лишняя комната и мокрая зона усложняют работу, % */
  roomK: number
  bathK: number
  /** Ширина вилки «от — до», % */
  spread: number
}

export type CalcLine = { id: string; label: string; sum: number; hint?: string }

export type CalcResult = {
  tariff: Tariff
  works: number
  materials: number
  extras: CalcLine[]
  extrasTotal: number
  total: number
  min: number
  max: number
  perM2: number
  days: number
  /** Что именно повлияло на цену — показываем в результате, чтобы не было магии */
  factors: { label: string; value: string }[]
}

export function tariffsFor(tariffs: Tariff[], property: PropertyType) {
  return tariffs.filter((t) => t.property === property)
}

/** Коэффициент за объём: чем больше площадь, тем дешевле метр. */
export function areaTierFor(tiers: AreaTier[], area: number): AreaTier | null {
  const sorted = [...tiers].sort((a, b) => a.areaFrom - b.areaFrom)
  let found: AreaTier | null = null
  for (const t of sorted) if (area >= t.areaFrom) found = t
  return found
}

const pct = (v: number) => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%'

export function calculate(content: SiteContent, input: CalcInput): CalcResult | null {
  const tariff = content.tariffs.find((t) => t.id === input.tariffId)
  if (!tariff) return null

  const { area, rooms, bathrooms, regionK, roomK, bathK } = input

  // Каждая лишняя комната — это ещё стены, двери и углы; каждый лишний санузел —
  // ещё одна мокрая зона с гидроизоляцией и разводкой.
  const roomsExtra = Math.max(0, rooms - 1) * (roomK / 100)
  const bathsExtra = Math.max(0, bathrooms - 1) * (bathK / 100)
  const tier = areaTierFor(content.areaTiers, area)
  const areaK = tier?.k ?? 1

  const complexity = (1 + roomsExtra + bathsExtra) * areaK

  const works = tariff.pricePerM2 * area * complexity * regionK

  const materials =
    tariff.withMaterials || input.materials === 'own' ? 0 : tariff.materialsPerM2 * area * regionK

  const extras: CalcLine[] = input.extras
    .map((id) => content.calcExtras.find((e) => e.id === id))
    .filter((e): e is CalcExtra => !!e)
    .map((e) => {
      const sum =
        e.kind === 'per_m2'
          ? e.amount * area * regionK
          : e.kind === 'per_bath'
            ? e.amount * bathrooms * regionK
            : e.amount * regionK
      return { id: e.id, label: e.label, sum, hint: e.hint }
    })

  const extrasTotal = extras.reduce((acc, e) => acc + e.sum, 0)
  const total = works + materials + extrasTotal
  const spread = (input.spread || 10) / 100

  const days = Math.round(
    tariff.termFrom +
      Math.min(1, area / 80) * (tariff.termTo - tariff.termFrom) +
      (bathrooms - 1) * 7,
  )

  const factors: { label: string; value: string }[] = []
  if (tier && areaK !== 1) factors.push({ label: tier.label || 'Объём работ', value: pct(areaK - 1) })
  if (roomsExtra) factors.push({ label: 'Комнат: ' + rooms, value: pct(roomsExtra) })
  if (bathsExtra) factors.push({ label: 'Санузлов: ' + bathrooms, value: pct(bathsExtra) })
  if (regionK !== 1) factors.push({ label: 'Город', value: '×' + regionK })

  return {
    tariff,
    works,
    materials,
    extras,
    extrasTotal,
    total,
    // Цены в тарифах — «от», поэтому нижняя граница это и есть расчёт,
    // а верхняя учитывает сложность объекта.
    min: total,
    max: total * (1 + spread),
    perM2: total / area,
    days: Math.min(days, tariff.termTo + 60),
    factors,
  }
}
