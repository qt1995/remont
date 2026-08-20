import { Play, Quote, Star } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { useContent, mediaUrl } from '@/lib/content'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={'Оценка ' + rating + ' из 5'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={'size-4 ' + (i <= rating ? 'fill-gold text-gold' : 'text-line')}
        />
      ))}
    </span>
  )
}

export function Reviews() {
  const { videoReviews, textReviews } = useContent()

  return (
    <Section
      id="reviews"
      tone="sand"
      eyebrow="Отзывы"
      title="Что говорят те, кто уже въехал"
      lead="Видео снимаем на объекте в день приёмки — без монтажа и заранее написанного текста."
    >
      <ul className="grid gap-5 md:grid-cols-3">
        {videoReviews.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl text-left"
              aria-label={'Смотреть видеоотзыв: ' + v.name + ', ' + v.object}
            >
              <img
                src={mediaUrl(v.poster)}
                alt=""
                width={800}
                height={600}
                loading="lazy"
                className="aspect-video w-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.05]"
              />
              <span aria-hidden className="absolute inset-0 bg-navy/45 transition-colors duration-300 group-hover:bg-navy/35" />

              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-16 place-items-center rounded-full bg-white/95 text-navy shadow-lift transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-110">
                  <Play aria-hidden className="ml-1 size-6 fill-current" />
                </span>
              </span>

              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/90 to-transparent p-4 text-white">
                <span>
                  <span className="block font-display text-base font-medium">{v.name}</span>
                  <span className="block text-[13px] text-white/70">{v.object}</span>
                </span>
                <span className="tnum text-[13px] text-white/70">{v.duration}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-subtle">
        На плитках пока кадры объектов — заменяются на реальные ролики после первой съёмки.
      </p>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {textReviews.map((r) => (
          <li
            key={r.name}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-6 transition-shadow duration-300 hover:shadow-card"
          >
            <Quote
              aria-hidden
              className="absolute -top-2 right-4 size-20 fill-gold/8 text-transparent"
            />
            <Stars rating={r.rating} />
            <p className="relative mt-4 flex-1 text-[15px] leading-relaxed text-navy-700">
              {r.text}
            </p>
            <footer className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full bg-sand font-display text-[15px] font-semibold text-navy"
              >
                {r.name.charAt(0)}
              </span>
              <span>
                <span className="block font-display text-[15px] font-medium">{r.name}</span>
                <span className="mt-0.5 block text-[13px] text-subtle">
                  {r.object} · {r.date}
                </span>
              </span>
            </footer>
          </li>
        ))}
      </ul>
    </Section>
  )
}
