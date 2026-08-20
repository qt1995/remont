import { BadgePercent, Banknote, FileSignature, ShieldCheck, Timer } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { useContent } from '@/lib/content'
import { useLeadModal } from '@/lib/leadModal'

const icons = [FileSignature, Timer, ShieldCheck, Banknote]

export function Guarantees() {
  const { openLead } = useLeadModal()
  const { guarantees, promos } = useContent()

  return (
    <Section
      id="guarantees"
      tone="navy"
      eyebrow="Гарантии"
      title="Что записано в договоре"
      lead="Обещания без бумаги ничего не стоят. Вот пункты, которые вы увидите в своём экземпляре."
    >
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {guarantees.map((g, i) => {
          const Icon = icons[i] ?? ShieldCheck
          return (
            <li key={g.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Icon aria-hidden className="mb-4 size-7 text-gold-300" />
              <h3 className="font-display text-lg font-semibold">{g.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/65">{g.text}</p>
            </li>
          )
        })}
      </ul>

      <div className="mt-12">
        <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold">
          <BadgePercent aria-hidden className="size-5 text-gold-300" />
          Действующие акции
        </h3>
        <ul className="grid gap-5 md:grid-cols-3">
          {promos.map((p) => (
            <li key={p.title} className="rounded-2xl bg-white p-6 text-ink">
              <span className="inline-block rounded-full bg-gold-100 px-2.5 py-1 font-display text-xs font-medium text-gold">
                {p.badge}
              </span>
              <h4 className="mt-3 font-display text-lg font-semibold">{p.title}</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-subtle">{p.text}</p>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          className="mt-6"
          onClick={() =>
            openLead({
              source: 'promos',
              title: 'Хочу воспользоваться акцией',
              lead: 'Уточним, какие акции суммируются с вашим случаем, и зафиксируем условия в договоре.',
            })
          }
        >
          Зафиксировать условия акции
        </Button>
      </div>
    </Section>
  )
}
