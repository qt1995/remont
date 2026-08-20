import { site } from '@/config/site'
import { API_URL } from '@/lib/content'
import { captureUtm, track } from '@/lib/analytics'

export type Lead = {
  name: string
  phone: string
  comment?: string
  source: string
  /** Расчёт калькулятора, если заявка пришла оттуда. */
  payload?: Record<string, unknown>
}

export type LeadResult = { ok: true } | { ok: false; error: string }

const LOCAL_KEY = 'remont:leads'

/**
 * Отправка заявки. Основной путь — API админки: заявка попадает в базу и
 * дублируется в Telegram. Если сервер не настроен, форму всё равно можно
 * проверить целиком: заявка складывается в localStorage.
 */
export async function submitLead(lead: Lead): Promise<LeadResult> {
  const record = {
    ...lead,
    utm: captureUtm(),
    page: typeof location === 'undefined' ? '' : location.pathname + location.search,
    createdAt: new Date().toISOString(),
  }

  const endpoint = API_URL ? API_URL + '/api/leads' : site.leadEndpoint

  if (!endpoint) {
    try {
      const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...prev, record]))
    } catch {
      /* приватный режим — не критично */
    }
    console.info('[lead] сервер не настроен, заявка сохранена локально', record)
    await new Promise((r) => setTimeout(r, 600))
    track('lead', { source: lead.source })
    return { ok: true }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      return { ok: false, error: data?.error ?? 'Сервер ответил ' + res.status }
    }

    track('lead', { source: lead.source })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Не удалось отправить заявку. Проверьте связь или позвоните нам.' }
  }
}

/** Телефон в формате +7 (999) 123-45-67 по мере ввода. */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (!digits.startsWith('7')) digits = '7' + digits
  digits = digits.slice(0, 11)

  const rest = digits.slice(1)
  let out = '+7'
  if (rest.length) out += ` (${rest.slice(0, 3)}`
  if (rest.length >= 3) out += `) ${rest.slice(3, 6)}`
  if (rest.length >= 6) out += `-${rest.slice(6, 8)}`
  if (rest.length >= 8) out += `-${rest.slice(8, 10)}`
  return out
}

export const isPhoneValid = (value: string) => value.replace(/\D/g, '').length === 11
