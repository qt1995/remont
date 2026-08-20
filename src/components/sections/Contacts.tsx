import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { LeadForm } from '@/components/forms/LeadForm'
import { useContent } from '@/lib/content'
import { track } from '@/lib/analytics'
import { useRegion } from '@/lib/region'

export function Contacts() {
  const { region } = useRegion()
  const { settings } = useContent()
  const phoneHref = 'tel:' + settings.phone.replace(/[^\d+]/g, '')

  return (
    <Section
      id="contacts"
      tone="sand"
      eyebrow="Контакты"
      title="Как с нами связаться"
      lead="Отвечаем на звонки и в мессенджерах. Замер — бесплатно, приезжаем в удобное вам время, включая выходные."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-12">
        <div>
          <ul className="grid gap-4 sm:grid-cols-2">
            <li className="rounded-2xl border border-line bg-white p-5">
              <Phone aria-hidden className="mb-3 size-5 text-gold" />
              <p className="text-[13px] tracking-wide text-subtle uppercase">Телефон</p>
              <a
                href={phoneHref}
                onClick={() => track('call_click', { place: 'contacts' })}
                className="tnum mt-1 inline-flex min-h-11 items-center font-display text-xl font-semibold hover:text-gold"
              >
                {settings.phone}
              </a>
            </li>

            <li className="rounded-2xl border border-line bg-white p-5">
              <Mail aria-hidden className="mb-3 size-5 text-gold" />
              <p className="text-[13px] tracking-wide text-subtle uppercase">Почта</p>
              <a
                href={'mailto:' + settings.email}
                className="mt-1 inline-flex min-h-11 items-center font-display text-xl font-semibold break-all hover:text-gold"
              >
                {settings.email}
              </a>
            </li>

            <li className="rounded-2xl border border-line bg-white p-5">
              <Clock aria-hidden className="mb-3 size-5 text-gold" />
              <p className="text-[13px] tracking-wide text-subtle uppercase">Когда работаем</p>
              <p className="mt-1 font-display text-[17px] font-medium">{settings.workHours}</p>
              <p className="mt-0.5 text-sm text-subtle">Заявки с сайта принимаем круглосуточно</p>
            </li>

            <li className="rounded-2xl border border-line bg-white p-5">
              <MapPin aria-hidden className="mb-3 size-5 text-gold" />
              <p className="text-[13px] tracking-wide text-subtle uppercase">Где встречаемся</p>
              {settings.office ? (
                <>
                  <p className="mt-1 font-display text-[17px] font-medium">{settings.office.address}</p>
                  <p className="mt-0.5 text-sm text-subtle">{settings.office.hours}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-display text-[17px] font-medium">
                    На вашем объекте в {region.nameIn}
                  </p>
                  <p className="mt-0.5 text-sm text-subtle">
                    Офис в стадии открытия — пока приезжаем к вам сами
                  </p>
                </>
              )}
            </li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={settings.telegram}
              onClick={() => track('messenger_click', { place: 'telegram' })}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 font-display font-medium transition-colors hover:border-navy hover:bg-sand"
            >
              <Send aria-hidden className="size-4 text-gold" />
              Telegram
            </a>
            <a
              href={settings.whatsapp}
              onClick={() => track('messenger_click', { place: 'whatsapp' })}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 font-display font-medium transition-colors hover:border-navy hover:bg-sand"
            >
              <MessageCircle aria-hidden className="size-4 text-gold" />
              WhatsApp
            </a>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-subtle">
            Работаем по договору как {settings.legal}, ИНН {settings.inn}. Даём полный пакет закрывающих
            документов — подходит для ипотечных и субсидированных квартир.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
          <h3 className="font-display text-2xl font-semibold">Оставьте заявку</h3>
          <p className="mt-2 mb-6 text-[15px] text-subtle">
            Перезвоним, зададим несколько вопросов и назовём вилку по деньгам ещё до выезда на
            объект.
          </p>
          <LeadForm source="contacts" />
        </div>
      </div>
    </Section>
  )
}
