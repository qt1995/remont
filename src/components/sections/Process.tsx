import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { stages } from '@/data/content'
import { useLeadModal } from '@/lib/leadModal'

export function Process() {
  const { openLead } = useLeadModal()

  return (
    <Section
      id="stages"
      eyebrow="Как работаем"
      title="Шесть шагов от звонка до ключей"
      lead="Каждый этап заканчивается документом или отчётом: сметой, договором, фотоотчётом, актом приёмки."
      headerAside={
        <Button size="lg" onClick={() => openLead({ source: 'process' })}>
          Начать с бесплатного замера
        </Button>
      }
    >
      <ol className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((s) => (
          <li key={s.n} className="group relative pt-10">
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-line" />
            <span
              aria-hidden
              className="absolute top-0 left-0 size-3 -translate-y-1/2 rounded-full bg-gold ring-4 ring-paper transition-transform duration-300 group-hover:scale-125"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-2 right-0 font-display text-[64px] leading-none font-bold text-navy/6 select-none"
            >
              {s.n}
            </span>

            <p className="font-display text-[12px] tracking-[0.2em] text-gold uppercase">
              Этап {s.n}
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-subtle">{s.text}</p>
            <p className="tnum mt-4 inline-flex items-center gap-2 rounded-lg bg-sand px-3 py-1.5 text-[13px] font-medium text-navy-700">
              <span aria-hidden className="size-1.5 rounded-full bg-gold" />
              {s.duration}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
