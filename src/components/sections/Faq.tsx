import { MessageCircleQuestion } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Section'
import { AccordionItem } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { faq } from '@/data/content'
import { useReveal } from '@/lib/useReveal'
import { useLeadModal } from '@/lib/leadModal'

export function Faq() {
  const { ref, visible } = useReveal<HTMLElement>()
  const { openLead } = useLeadModal()

  return (
    <section
      id="faq"
      ref={ref}
      className={
        'relative overflow-hidden bg-paper py-18 transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)] md:py-26 ' +
        (visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 mask-fade-y bg-blueprint" />

      <div className="container-page relative grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Вопросы</Eyebrow>
          <h2 className="text-[30px] leading-[1.08] font-semibold md:text-[44px]">
            Отвечаем до того, как вы позвоните
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-subtle">
            Восемь вопросов, которые задают почти на каждом замере. Если чего-то не хватает —
            спросите, добавим ответ сюда.
          </p>

          <div className="mt-7 rounded-2xl border border-line bg-sand p-5">
            <p className="flex items-center gap-2 font-display text-[15px] font-medium">
              <MessageCircleQuestion aria-hidden className="size-5 text-gold" />
              Не нашли свой вопрос?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-subtle">
              Позвоните или напишите — ответим без «оставьте заявку, менеджер перезвонит».
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() =>
                openLead({
                  source: 'faq',
                  title: 'Задать вопрос',
                  lead: 'Напишите вопрос в поле ниже — ответим текстом или перезвоним, как вам удобнее.',
                })
              }
            >
              Задать вопрос
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white px-6 md:px-9">
          {faq.map((f) => (
            <AccordionItem key={f.q} title={f.q}>
              {f.a}
            </AccordionItem>
          ))}
        </div>
      </div>
    </section>
  )
}
