import { Calculator, Clock, FileSignature, Ruler, ShieldCheck, Box } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CountUp } from '@/components/ui/CountUp'
import { useLeadModal } from '@/lib/leadModal'
import { useRegion } from '@/lib/region'
import { formatMoney } from '@/lib/format'
import { stats } from '@/config/site'
import { asset } from '@/lib/asset'

const advantages = [
  {
    icon: FileSignature,
    title: 'Фиксированная смета',
    text: 'Сумма из договора не растёт по ходу работ',
  },
  { icon: Clock, title: 'Штраф за просрочку', text: 'Сдвинули срок по своей вине — вычитаем из суммы' },
  { icon: ShieldCheck, title: 'Гарантия 5 лет', text: 'На работы; 2 года на инженерные системы' },
  { icon: Ruler, title: 'Замер бесплатно', text: 'Приедем, обмерим и посчитаем без обязательств' },
]

export function Hero() {
  const { openLead } = useLeadModal()
  const { region } = useRegion()

  const roughPerM2 = 4900 * region.k
  const turnkeyPerM2 = 9900 * region.k

  return (
    <section id="top" className="relative overflow-hidden bg-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-blueprint-dark" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-52 -right-40 size-[620px] rounded-full bg-gold/22 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-64 -left-40 size-[560px] rounded-full bg-blue/35 blur-[140px]"
      />

      <div className="container-page relative">
        <div className="grid gap-14 pt-12 pb-14 md:pt-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:pt-20 lg:pb-20">
          <div>
            <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] text-white/80 backdrop-blur-sm">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-300 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-gold-300" />
              </span>
              Работаем в {region.nameIn} и области
            </p>

            <h1 className="text-[36px] leading-[1.04] font-bold tracking-[-0.025em] sm:text-[48px] lg:text-[62px]">
              Ремонт квартир
              <br />
              под ключ{' '}
              <span className="relative inline-block text-gold-300">
                без сюрпризов
                <svg
                  aria-hidden
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-gold/70"
                >
                  <path
                    d="M2 8 C 60 2, 120 2, 180 6 S 260 10, 298 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/70 md:text-lg">
              Считаем по прайсу, а не «на глаз». До подписания договора вы видите цену каждого вида
              работ, объёмы в метрах и календарный график. После — она не меняется.
            </p>

            <div className="mt-9 flex flex-wrap items-stretch gap-x-8 gap-y-5 rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div>
                <p className="text-[12px] tracking-[0.14em] text-white/45 uppercase">
                  Черновой ремонт
                </p>
                <p className="tnum mt-1 font-display text-2xl font-semibold md:text-[28px]">
                  от {formatMoney(roughPerM2)}
                  <span className="text-base font-normal text-white/55">/м²</span>
                </p>
              </div>
              <div className="w-px self-stretch bg-white/12" aria-hidden />
              <div>
                <p className="text-[12px] tracking-[0.14em] text-white/45 uppercase">Под ключ</p>
                <p className="tnum mt-1 font-display text-2xl font-semibold md:text-[28px]">
                  от {formatMoney(turnkeyPerM2)}
                  <span className="text-base font-normal text-white/55">/м²</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                size="lg"
                className="shrink-0 whitespace-nowrap"
                onClick={() => document.getElementById('calc')?.scrollIntoView({ block: 'start' })}
              >
                <Calculator aria-hidden className="size-5" />
                Рассчитать за 60 секунд
              </Button>
              <Button
                size="lg"
                variant="outlineDark"
                className="shrink-0 whitespace-nowrap"
                onClick={() => openLead({ source: 'hero' })}
              >
                Записаться на консультацию
              </Button>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="relative overflow-hidden rounded-[24px] border border-white/12 shadow-lift">
              <img
                src={asset('stages/3-furnished.svg')}
                alt="Гостиная после ремонта под ключ с мебелью и текстилем"
                width={1600}
                height={1000}
                className="aspect-[16/10] w-full object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent"
              />

              <p className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-navy/85 px-3.5 py-2 text-[13px] font-medium backdrop-blur-sm">
                <Box aria-hidden className="size-4 text-gold-300" />
                3D-визуализация до старта
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-sm sm:absolute sm:-bottom-10 sm:-left-4 sm:mt-0 sm:max-w-[272px] sm:bg-navy-800/95 lg:-left-8">
              <p className="flex items-center gap-2 font-display text-[15px] font-medium">
                <FileSignature aria-hidden className="size-4 text-gold-300" />
                Смета в договоре
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-white/60">
                Стоимость работ фиксируется до старта. Изменения — только через допсоглашение, которое
                подписываете вы.
              </p>
            </div>
          </div>
        </div>

        {/* Цифры */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 py-10 sm:grid-cols-4 lg:mt-8">
          {stats.map((s) => {
            const numeric = Number(s.value)
            return (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="tnum block font-display text-[32px] leading-none font-bold text-gold-300 md:text-[40px]">
                    {Number.isFinite(numeric) ? <CountUp to={numeric} /> : s.value}
                    {s.suffix}
                  </span>
                  <span className="mt-2.5 block text-[13px] leading-snug text-white/55">
                    {s.label}
                  </span>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      {/* Полоса преимуществ */}
      <div className="relative border-t border-white/10 bg-navy-800/60">
        <ul className="container-page grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {advantages.map((a) => (
            <li key={a.title} className="flex items-start gap-3.5 px-0 py-6 sm:px-6 sm:first:pl-0 lg:last:pr-0">
              <a.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-gold-300" />
              <span>
                <span className="block font-display text-[15px] font-medium">{a.title}</span>
                <span className="mt-1 block text-[13px] leading-snug text-white/55">{a.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
