import { API_ENABLED, API_URL } from '@/lib/content'

const SESSION_KEY = 'remont:sid'
const UTM_KEY = 'remont:utm'

const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void
  }
}

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

/** Метки кампании запоминаем на весь визит: заявка может прийти через десять минут. */
export function captureUtm(): Record<string, string> {
  try {
    const params = new URLSearchParams(window.location.search)
    const fresh: Record<string, string> = {}
    for (const f of UTM_FIELDS) {
      const v = params.get(f)
      if (v) fresh[f] = v.slice(0, 200)
    }
    if (Object.keys(fresh).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh))
      return fresh
    }
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? '{}')
  } catch {
    return {}
  }
}

let metrikaId = 0

/** Событие уходит и в свою базу, и целью в Яндекс.Метрику, если счётчик подключён. */
export function track(type: string, meta: Record<string, unknown> = {}) {
  if (metrikaId && window.ym) {
    try {
      window.ym(metrikaId, 'reachGoal', type, meta)
    } catch {
      /* счётчик мог не догрузиться — не важно */
    }
  }

  if (!API_ENABLED) return

  const body = JSON.stringify({
    type,
    sessionId: sessionId(),
    path: window.location.pathname + window.location.search,
    referrer: document.referrer,
    utm: captureUtm(),
    meta,
  })

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_URL + '/api/track', new Blob([body], { type: 'application/json' }))
      return
    }
  } catch {
    /* некоторые браузеры ругаются на Blob в sendBeacon — уходим на fetch */
  }

  fetch(API_URL + '/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

/** Подключает счётчик Яндекс.Метрики по номеру из админки. */
export function initMetrika(id: string) {
  const num = Number(id)
  if (!num || metrikaId === num || document.getElementById('ym-script')) return
  metrikaId = num

  window.ym =
    window.ym ||
    function (...args: unknown[]) {
      ;(window.ym as unknown as { a: unknown[][] }).a =
        (window.ym as unknown as { a?: unknown[][] }).a || []
      ;(window.ym as unknown as { a: unknown[][] }).a.push(args)
    }

  const script = document.createElement('script')
  script.id = 'ym-script'
  script.async = true
  script.src = 'https://mc.yandex.ru/metrika/tag.js'
  document.head.appendChild(script)

  window.ym(num, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
}
