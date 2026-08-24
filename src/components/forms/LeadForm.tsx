import { useId, useRef, useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPhone, isPhoneValid, submitLead } from '@/lib/lead'
import { useContent, docUrl } from '@/lib/content'

type Props = {
  source: string
  payload?: Record<string, unknown>
  submitLabel?: string
  compact?: boolean
  onDone?: () => void
}

export function LeadForm({
  source,
  payload,
  submitLabel = 'Записаться на консультацию',
  compact = false,
  onDone,
}: Props) {
  const { settings } = useContent()
  const uid = useId()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [serverError, setServerError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  const validate = () => {
    const next: { name?: string; phone?: string } = {}
    if (name.trim().length < 2) next.name = 'Напишите, как к вам обращаться'
    if (!isPhoneValid(phone)) next.phone = 'Нужны все 11 цифр номера — так мы сможем перезвонить'
    return next
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const next = validate()
    setErrors(next)
    if (next.name) return nameRef.current?.focus()
    if (next.phone) return phoneRef.current?.focus()

    setState('sending')
    const res = await submitLead({
      name: name.trim(),
      phone,
      comment: comment.trim(),
      source,
      payload,
    })

    if (res.ok) {
      setState('done')
      onDone?.()
    } else {
      setState('idle')
      setServerError(res.error)
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border border-line bg-sand p-6 text-center" role="status">
        <CheckCircle2 aria-hidden className="mx-auto mb-3 size-10 text-gold" />
        <p className="font-display text-lg font-medium">Заявка принята</p>
        <p className="mt-2 text-[15px] text-subtle">
          Перезвоним в течение рабочего дня. Если удобнее в мессенджере — напишите нам в{' '}
          <a href={settings.telegram} className="text-gold underline underline-offset-2">
            Telegram
          </a>
          .
        </p>
      </div>
    )
  }

  const field =
    'w-full min-h-12 rounded-xl border bg-white px-4 text-base outline-none transition-colors duration-200 placeholder:text-subtle/60 focus:border-navy'

  return (
    <form onSubmit={onSubmit} noValidate className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <label htmlFor={uid + '-name'} className="mb-1.5 block text-sm font-medium text-navy-700">
          Как вас зовут
        </label>
        <input
          id={uid + '-name'}
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, name: validate().name }))}
          autoComplete="name"
          placeholder="Денис"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? uid + '-name-err' : undefined}
          className={field + ' ' + (errors.name ? 'border-red-500' : 'border-line')}
        />
        {errors.name && (
          <p id={uid + '-name-err'} role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={uid + '-phone'} className="mb-1.5 block text-sm font-medium text-navy-700">
          Телефон <span className="text-gold">*</span>
        </label>
        <input
          id={uid + '-phone'}
          ref={phoneRef}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onBlur={() => setErrors((p) => ({ ...p, phone: validate().phone }))}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? uid + '-phone-err' : uid + '-phone-hint'}
          className={field + ' tnum ' + (errors.phone ? 'border-red-500' : 'border-line')}
        />
        {errors.phone ? (
          <p id={uid + '-phone-err'} role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.phone}
          </p>
        ) : (
          <p id={uid + '-phone-hint'} className="mt-1.5 text-sm text-subtle">
            Звоним один раз. Никаких рассылок и передачи номера третьим лицам.
          </p>
        )}
      </div>

      {!compact && (
        <div>
          <label
            htmlFor={uid + '-comment'}
            className="mb-1.5 block text-sm font-medium text-navy-700"
          >
            Что нужно сделать <span className="text-subtle">— необязательно</span>
          </label>
          <textarea
            id={uid + '-comment'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Двушка 58 м² в новостройке, нужен ремонт под ключ к лету"
            className={field + ' resize-y border-line py-3'}
          />
        </div>
      )}

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError} Телефон для связи:{' '}
          <a href={'tel:' + settings.phone.replace(/[^\d+]/g, '')} className="font-medium underline">
            {settings.phone}
          </a>
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={state === 'sending'}>
        {state === 'sending' ? (
          <>
            <Loader2 aria-hidden className="size-5 animate-spin" />
            Отправляем…
          </>
        ) : (
          submitLabel
        )}
      </Button>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
        <span>
          Нажимая кнопку, вы соглашаетесь с{' '}
          <a
            href={docUrl('/privacy')}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-navy"
          >
            политикой обработки персональных данных
          </a>
          .
        </span>
      </p>
    </form>
  )
}
