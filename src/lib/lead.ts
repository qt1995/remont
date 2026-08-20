import { site } from '@/config/site'

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
 * Отправка заявки. Пока бэкенда нет — заявка складывается в localStorage,
 * чтобы форму можно было проверить целиком. Подключение боевого приёмника:
 * положить URL в .env как VITE_LEAD_ENDPOINT.
 */
export async function submitLead(lead: Lead): Promise<LeadResult> {
  const record = { ...lead, createdAt: new Date().toISOString() }

  if (!site.leadEndpoint) {
    try {
      const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...prev, record]))
    } catch {
      /* приватный режим — не критично */
    }
    console.info('[lead] endpoint не задан, заявка сохранена локально', record)
    await new Promise((r) => setTimeout(r, 600))
    return { ok: true }
  }

  try {
    const res = await fetch(site.leadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
    if (!res.ok) return { ok: false, error: `Сервер ответил ${res.status}` }
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
