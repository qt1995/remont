export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch('/api' + path, {
    credentials: 'include',
    headers:
      init?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const fromServer =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : ''
    throw new ApiError(fromServer || 'Ошибка запроса (' + res.status + ')', res.status)
  }

  return data as T
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  put: <T>(p: string, body?: unknown) => request<T>(p, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
}

/* ─────────────  Типы, общие для админки  ───────────── */

export type Row = Record<string, unknown> & { id: number | string; sort?: number }

export type Lead = {
  id: number
  name: string
  phone: string
  comment: string
  source: string
  status: LeadStatus
  admin_note: string
  page: string
  created_at: string
  updated_at: string
  payload: Record<string, unknown>
  utm: Record<string, string>
}

export type LeadStatus = 'new' | 'in_progress' | 'measure' | 'deal' | 'rejected'

export const LEAD_STATUSES: { id: LeadStatus; label: string; tone: 'new' | 'work' | 'ok' | 'bad' }[] = [
  { id: 'new', label: 'Новая', tone: 'new' },
  { id: 'in_progress', label: 'В работе', tone: 'work' },
  { id: 'measure', label: 'Замер назначен', tone: 'work' },
  { id: 'deal', label: 'Договор', tone: 'ok' },
  { id: 'rejected', label: 'Отказ', tone: 'bad' },
]

export const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.id === s)?.label ?? s

export type Metrics = {
  days: number
  sessions: number
  leads: number
  conversion: number
  totals: Record<string, number>
  daily: { day: string; type: string; c: number }[]
  leadSources: { source: string; c: number }[]
  channels: { name: string; count: number }[]
}

export type Settings = Record<string, string>

export type MediaItem = {
  id: number
  filename: string
  original_name: string
  mime: string
  size: number
  created_at: string
  url: string
}
