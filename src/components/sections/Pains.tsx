import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { pains } from '@/data/content'

export function Pains() {
  return (
    <Section
      id="pains"
      tone="sand"
      eyebrow="Честно о рисках"
      title="Чего боятся все, кто заказывает ремонт"
      lead="Это не выдуманные возражения — так действительно бывает. Ниже, что мы сделали, чтобы этого не случилось у вас."
    >
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {pains.map((p) => (
          <li
            key={p.problem}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="flex gap-3.5 p-6 pb-5">
              <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-red-500/80" />
              <p className="font-display text-[17px] leading-snug font-medium text-navy">
                «{p.problem}»
              </p>
            </div>

            <div aria-hidden className="mx-6 h-2 rule-ticks" />

            <div className="flex flex-1 gap-3.5 bg-white p-6 pt-5">
              <span
                aria-hidden
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold/12"
              >
                <ShieldCheck className="size-3.5 text-gold" />
              </span>
              <p className="text-[15px] leading-relaxed text-navy-700">{p.solution}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
