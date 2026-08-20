import { getSettings } from '../db.js'

const escape = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const money = (n) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
    .format(Math.round(Number(n) || 0))

/** Собирает читаемое сообщение из заявки, включая расчёт калькулятора. */
export function formatLead(lead) {
  const lines = [
    '<b>Новая заявка с сайта</b>',
    '',
    'Имя: <b>' + escape(lead.name || '—') + '</b>',
    'Телефон: <b>' + escape(lead.phone) + '</b>',
  ]

  if (lead.comment) lines.push('Комментарий: ' + escape(lead.comment))
  if (lead.source) lines.push('Откуда: <code>' + escape(lead.source) + '</code>')

  const p = lead.payload && typeof lead.payload === 'object' ? lead.payload : {}
  const hasCalc = p.area || p.tariff || p.min

  if (hasCalc) {
    lines.push('', '<b>Расчёт</b>')
    if (p.tariff) lines.push('Тариф: ' + escape(p.tariff))
    if (p.region) lines.push('Город: ' + escape(p.region))
    if (p.area) lines.push('Площадь: ' + escape(p.area) + ' м²')
    if (p.rooms) lines.push('Комнат: ' + escape(p.rooms) + ', санузлов: ' + escape(p.bathrooms))
    if (p.materials) lines.push('Материалы: ' + escape(p.materials))
    if (Array.isArray(p.extras) && p.extras.length) lines.push('Допы: ' + escape(p.extras.join(', ')))
    if (p.min && p.max) lines.push('Вилка: <b>' + money(p.min) + ' — ' + money(p.max) + '</b>')
    if (p.days) lines.push('Срок: ≈ ' + escape(p.days) + ' дн.')
  }

  const utm = lead.utm && typeof lead.utm === 'object' ? lead.utm : {}
  const utmPairs = Object.entries(utm).filter(([, v]) => v)
  if (utmPairs.length) {
    lines.push('', '<b>Источник</b>')
    for (const [k, v] of utmPairs) lines.push(escape(k) + ': ' + escape(v))
  }

  return lines.join('\n')
}

/**
 * Отправка в Telegram. Токен и чат берутся из настроек — их вводят в админке.
 * Ошибка отправки не должна ронять приём заявки, поэтому только логируем.
 */
export async function notifyLead(lead) {
  const s = getSettings()
  if (s.telegramNotify !== '1') return { ok: false, skipped: 'выключено в настройках' }
  if (!s.telegramBotToken || !s.telegramChatId) return { ok: false, skipped: 'не заданы токен или чат' }

  try {
    const res = await fetch('https://api.telegram.org/bot' + s.telegramBotToken + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: s.telegramChatId,
        text: formatLead(lead),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!data.ok) {
      console.warn('[telegram] не отправилось:', data.description || res.status)
      return { ok: false, error: data.description || 'HTTP ' + res.status }
    }
    return { ok: true }
  } catch (e) {
    console.warn('[telegram] сеть недоступна:', e.message)
    return { ok: false, error: e.message }
  }
}

/** Проверка настроек из админки: шлём тестовое сообщение. */
export async function sendTest(token, chatId) {
  if (!token || !chatId) return { ok: false, error: 'Заполните токен и ID чата' }
  try {
    const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ Проверка связи. Заявки с сайта будут приходить сюда.',
      }),
    })
    const data = await res.json().catch(() => ({}))
    return data.ok ? { ok: true } : { ok: false, error: data.description || 'HTTP ' + res.status }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}
