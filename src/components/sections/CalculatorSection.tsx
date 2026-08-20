import { useMemo, useState } from 'react'
import { Gauge, Minus, Plus, Timer } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Segmented } from '@/components/ui/Segmented'
import { Button } from '@/components/ui/Button'
import { calculate, EXTRAS, tariffsFor, type ExtraId, type MaterialsMode } from '@/lib/calc'
import type { PropertyType } from '@/data/tariffs'
import { formatDays, formatMoney, roundTo } from '@/lib/format'
import { useRegion } from '@/lib/region'
import { useLeadModal } from '@/lib/leadModal'

const propertyOptions = [
  { id: 'new' as PropertyType, label: 'Новостройка' },
  { id: 'old' as PropertyType, label: 'Вторичка' },
]

const materialOptions = [
  { id: 'own' as MaterialsMode, label: 'Закупаю сам' },
  { id: 'ours' as MaterialsMode, label: 'Закупаете вы' },
]

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-3 font-display text-base font-medium">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full bg-navy font-display text-[13px] font-semibold text-gold-300"
      >
        {n}
      </span>
      {children}
    </h3>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-navy-700">{label}</span>
      <div className="inline-flex items-center rounded-xl border border-line bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={'Уменьшить: ' + label}
          className="grid size-12 cursor-pointer place-items-center rounded-l-xl text-navy transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <span className="tnum w-12 text-center font-display text-lg font-medium" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={'Увеличить: ' + label}
          className="grid size-12 cursor-pointer place-items-center rounded-r-xl text-navy transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function CalculatorSection() {
  const { region } = useRegion()
  const { openLead } = useLeadModal()

  const [property, setProperty] = useState<PropertyType>('new')
  const [tariffId, setTariffId] = useState('new-turnkey')
  const [area, setArea] = useState(52)
  const [rooms, setRooms] = useState(2)
  const [bathrooms, setBathrooms] = useState(1)
  const [materials, setMaterials] = useState<MaterialsMode>('ours')
  const [extras, setExtras] = useState<ExtraId[]>(['design'])

  const list = tariffsFor(property)

  const onProperty = (p: PropertyType) => {
    setProperty(p)
    setTariffId(tariffsFor(p)[0].id)
  }

  const result = useMemo(
    () =>
      calculate({ property, tariffId, area, rooms, bathrooms, materials, extras, regionK: region.k }),
    [property, tariffId, area, rooms, bathrooms, materials, extras, region.k],
  )

  const toggleExtra = (id: ExtraId) =>
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const withMaterials = result?.tariff.withMaterials ?? false

  return (
    <Section
      id="calc"
      eyebrow="Калькулятор"
      title="Прикидка стоимости за 60 секунд"
      lead="Шесть вопросов — и вы видите вилку по деньгам и срокам. Это не смета, а честный ориентир: точную сумму даём после замера."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <div className="space-y-7 rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
          <div>
            <StepTitle n={1}>Что за квартира</StepTitle>
            <Segmented
              options={propertyOptions}
              value={property}
              onChange={onProperty}
              ariaLabel="Тип квартиры"
            />
          </div>

          <div>
            <StepTitle n={2}>Какой нужен ремонт</StepTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((t) => {
                const active = t.id === tariffId
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTariffId(t.id)}
                    aria-pressed={active}
                    className={
                      'cursor-pointer rounded-xl border p-4 text-left transition-[border-color,background-color] duration-200 ' +
                      (active ? 'border-navy bg-sand' : 'border-line hover:border-navy/40')
                    }
                  >
                    <span className="block font-display text-[15px] font-medium">{t.name}</span>
                    <span className="tnum mt-0.5 block text-sm text-subtle">
                      от {formatMoney(t.pricePerM2 * region.k)}/м²
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h3 className="flex items-center gap-3 font-display text-base font-medium">
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-navy font-display text-[13px] font-semibold text-gold-300"
                >
                  3
                </span>
                Площадь квартиры
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={area}
                  min={18}
                  max={250}
                  onChange={(e) =>
                    setArea(Math.min(250, Math.max(18, Number(e.target.value) || 18)))
                  }
                  aria-label="Площадь квартиры в квадратных метрах"
                  className="tnum h-11 w-24 rounded-xl border border-line px-3 text-right font-display text-lg font-medium outline-none focus:border-navy"
                />
                <span className="text-subtle">м²</span>
              </div>
            </div>
            <input
              type="range"
              min={18}
              max={250}
              step={1}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              aria-label="Площадь квартиры, ползунок"
              className="h-11 w-full cursor-pointer accent-gold"
            />
          </div>

          <div>
            <StepTitle n={4}>Комнаты и санузлы</StepTitle>
            <div className="flex flex-wrap gap-6">
              <Stepper label="Комнат" value={rooms} min={1} max={6} onChange={setRooms} />
              <Stepper label="Санузлов" value={bathrooms} min={1} max={4} onChange={setBathrooms} />
            </div>
          </div>

          {!withMaterials && (
            <div>
              <StepTitle n={5}>Материалы</StepTitle>
              <p className="mt-1 mb-3 text-sm text-subtle">
                Если закупаете сами — мы даём спецификацию с точными объёмами.
              </p>
              <Segmented
                options={materialOptions}
                value={materials}
                onChange={setMaterials}
                ariaLabel="Кто закупает материалы"
                size="sm"
              />
            </div>
          )}

          <div>
            <StepTitle n={withMaterials ? 5 : 6}>Дополнительно</StepTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXTRAS.map((e) => {
                const active = extras.includes(e.id)
                return (
                  <label
                    key={e.id}
                    className={
                      'flex cursor-pointer gap-3 rounded-xl border p-4 transition-[border-color,background-color] duration-200 ' +
                      (active ? 'border-navy bg-sand' : 'border-line hover:border-navy/40')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleExtra(e.id)}
                      className="mt-0.5 size-5 shrink-0 cursor-pointer accent-gold"
                    />
                    <span>
                      <span className="block font-display text-[15px] font-medium">{e.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-subtle">
                        {e.hint}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Результат */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white shadow-lift md:p-7">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-gold/20 blur-[70px]"
            />
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] text-white/80">
              <Timer aria-hidden className="size-4 text-gold-300" />
              Ориентир, а не финальная смета
            </p>

            <div aria-live="polite">
              {result && (
                <>
                  <p className="text-[13px] tracking-wide text-white/50 uppercase">
                    Ремонт «{result.tariff.name}», {area} м², {region.name}
                  </p>
                  <p className="tnum mt-2 font-display text-[36px] leading-tight font-bold md:text-[42px]">
                    {formatMoney(roundTo(result.min, 10000))}
                  </p>
                  <p className="tnum -mt-1 font-display text-lg text-white/60">
                    до {formatMoney(roundTo(result.max, 10000))}
                  </p>

                  <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[15px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/60">Работы</dt>
                      <dd className="tnum font-medium">{formatMoney(result.works)}</dd>
                    </div>
                    {result.materials > 0 && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-white/60">Материалы</dt>
                        <dd className="tnum font-medium">{formatMoney(result.materials)}</dd>
                      </div>
                    )}
                    {result.extras.map((e) => (
                      <div key={e.id} className="flex justify-between gap-4">
                        <dt className="text-white/60">{e.label}</dt>
                        <dd className="tnum font-medium">{formatMoney(e.sum)}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                      <dt className="text-white/60">Итого за м²</dt>
                      <dd className="tnum font-medium">{formatMoney(result.perM2)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/60">Срок работ</dt>
                      <dd className="tnum font-medium">≈ {formatDays(result.days)}</dd>
                    </div>
                  </dl>

                  <Button
                    size="lg"
                    className="mt-6 w-full"
                    onClick={() =>
                      openLead({
                        source: 'calculator',
                        title: 'Смета по вашему расчёту',
                        lead:
                          'Пришлём подробную смету по позициям и график работ. Расчёт: ' +
                          result.tariff.name +
                          ', ' +
                          area +
                          ' м², ' +
                          formatMoney(roundTo(result.min, 10000)) +
                          ' — ' +
                          formatMoney(roundTo(result.max, 10000)) +
                          '.',
                        payload: {
                          region: region.name,
                          tariff: result.tariff.name,
                          area,
                          rooms,
                          bathrooms,
                          materials: withMaterials ? 'включены в тариф' : materials,
                          extras: result.extras.map((e) => e.label),
                          min: Math.round(result.min),
                          max: Math.round(result.max),
                          days: result.days,
                        },
                      })
                    }
                  >
                    Получить точную смету
                  </Button>
                </>
              )}
            </div>

            <p className="mt-4 flex items-start gap-2 text-[13px] leading-snug text-white/50">
              <Gauge aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-300" />
              Вилка ±10% учитывает состояние квартиры и сложность геометрии. После замера цифра
              становится фиксированной.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
