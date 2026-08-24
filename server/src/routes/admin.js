import { Router } from 'express'
import multer from 'multer'
import { extname, join } from 'node:path'
import { unlink } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { db, getSettings, setSettings, UPLOAD_DIR } from '../db.js'
import { crudRouter } from '../lib/crud.js'
import { changePassword, requireAuth } from '../lib/auth.js'
import { sendTest } from '../lib/telegram.js'
import { contractText, privacyText } from '../lib/legal.js'

export const adminRouter = Router()

adminRouter.use(requireAuth)

/* ─────────────────────────  Контент  ───────────────────────── */

const T = (name, type = 'text') => ({ name, type })

adminRouter.use(
  '/tariffs',
  crudRouter({
    table: 'tariffs',
    idType: 'text',
    columns: [
      T('property'),
      T('name'),
      T('price_per_m2', 'int'),
      T('with_materials', 'bool'),
      T('materials_per_m2', 'int'),
      T('summary'),
      T('term_from', 'int'),
      T('term_to', 'int'),
      T('popular', 'bool'),
      T('price_from', 'bool'),
      T('materials_note'),
      T('sort', 'int'),
      T('active', 'bool'),
    ],
    child: {
      table: 'tariff_items',
      fk: 'tariff_id',
      columns: [T('kind'), T('text'), T('emphasis')],
    },
  }),
)

adminRouter.use(
  '/price-groups',
  crudRouter({
    table: 'price_groups',
    idType: 'text',
    columns: [
      T('name'),
      T('hint'),
      T('visible_limit', 'int'),
      T('sort', 'int'),
      T('active', 'bool'),
    ],
    child: {
      table: 'price_items',
      fk: 'group_id',
      columns: [
        T('name'),
        T('price', 'int'),
        T('unit'),
        T('comment'),
        T('emphasis'),
        T('active', 'bool'),
      ],
    },
  }),
)

adminRouter.use(
  '/works',
  crudRouter({
    table: 'works',
    columns: [
      T('title'),
      T('address'),
      T('type'),
      T('type_label'),
      T('area', 'int'),
      T('days', 'int'),
      T('budget', 'int'),
      T('style'),
      T('image'),
      T('sort', 'int'),
      T('active', 'bool'),
    ],
    child: { table: 'work_scope', fk: 'work_id', columns: [T('text')] },
  }),
)

adminRouter.use(
  '/stage-shots',
  crudRouter({
    table: 'stage_shots',
    columns: [T('name'), T('caption'), T('price'), T('image'), T('sort', 'int')],
  }),
)

adminRouter.use(
  '/regions',
  crudRouter({
    table: 'regions',
    idType: 'text',
    columns: [T('name'), T('name_in'), T('k', 'real'), T('sort', 'int'), T('active', 'bool')],
  }),
)

adminRouter.use(
  '/stats',
  crudRouter({ table: 'stats', columns: [T('value'), T('suffix'), T('label'), T('sort', 'int')] }),
)

adminRouter.use(
  '/pains',
  crudRouter({ table: 'pains', columns: [T('problem'), T('solution'), T('sort', 'int')] }),
)

adminRouter.use(
  '/process-steps',
  crudRouter({
    table: 'process_steps',
    columns: [T('n'), T('title'), T('text'), T('duration'), T('sort', 'int')],
  }),
)

adminRouter.use(
  '/guarantees',
  crudRouter({ table: 'guarantees', columns: [T('title'), T('text'), T('sort', 'int')] }),
)

adminRouter.use(
  '/promos',
  crudRouter({
    table: 'promos',
    columns: [T('title'), T('text'), T('badge'), T('sort', 'int'), T('active', 'bool')],
  }),
)

adminRouter.use(
  '/reviews-text',
  crudRouter({
    table: 'reviews_text',
    columns: [
      T('name'),
      T('object'),
      T('date'),
      T('rating', 'int'),
      T('text'),
      T('sort', 'int'),
      T('active', 'bool'),
    ],
  }),
)

adminRouter.use(
  '/reviews-video',
  crudRouter({
    table: 'reviews_video',
    columns: [
      T('name'),
      T('object'),
      T('duration'),
      T('poster'),
      T('url'),
      T('sort', 'int'),
      T('active', 'bool'),
    ],
  }),
)

adminRouter.use(
  '/tariff-notes',
  crudRouter({
    table: 'tariff_notes',
    columns: [T('title'), T('value'), T('note'), T('sort', 'int'), T('active', 'bool')],
  }),
)

adminRouter.use(
  '/calc-extras',
  crudRouter({
    table: 'calc_extras',
    idType: 'text',
    columns: [
      T('label'),
      T('hint'),
      T('kind'),
      T('amount', 'int'),
      T('sort', 'int'),
      T('active', 'bool'),
    ],
  }),
)

adminRouter.use(
  '/area-tiers',
  crudRouter({
    table: 'area_tiers',
    columns: [T('area_from', 'int'), T('k', 'real'), T('label'), T('sort', 'int')],
  }),
)

adminRouter.use(
  '/hero-features',
  crudRouter({
    table: 'hero_features',
    columns: [T('icon'), T('title'), T('text'), T('sort', 'int')],
  }),
)

adminRouter.use(
  '/partners',
  crudRouter({
    table: 'partners',
    columns: [T('name'), T('note'), T('logo'), T('url'), T('sort', 'int'), T('active', 'bool')],
  }),
)

adminRouter.use(
  '/faq',
  crudRouter({ table: 'faq', columns: [T('q'), T('a'), T('sort', 'int'), T('active', 'bool')] }),
)

/* ─────────────────────────  Настройки  ───────────────────────── */

adminRouter.get('/settings', (_req, res) => {
  const s = getSettings()
  // Токен бота наружу не отдаём целиком — только признак, что он задан.
  res.json({ ...s, telegramBotToken: s.telegramBotToken ? '••••' + s.telegramBotToken.slice(-6) : '' })
})

adminRouter.put('/settings', (req, res) => {
  const patch = { ...req.body }
  // Пустое или замаскированное значение токена означает «не менять».
  if (!patch.telegramBotToken || patch.telegramBotToken.startsWith('••••')) {
    delete patch.telegramBotToken
  }
  delete patch.id
  const s = setSettings(patch)
  res.json({ ...s, telegramBotToken: s.telegramBotToken ? '••••' + s.telegramBotToken.slice(-6) : '' })
})

adminRouter.post('/settings/telegram-test', async (req, res) => {
  const s = getSettings()
  const token = req.body?.telegramBotToken?.startsWith('••••')
    ? s.telegramBotToken
    : req.body?.telegramBotToken || s.telegramBotToken
  const chat = req.body?.telegramChatId || s.telegramChatId
  res.json(await sendTest(token, chat))
})

/**
 * Встроенный шаблон документа — чтобы в админке можно было начать
 * не с пустого поля, а с готового текста и править его.
 */
adminRouter.get('/legal/:kind/template', (req, res) => {
  if (req.params.kind === 'privacy') return res.json({ text: privacyText() })
  if (req.params.kind === 'contract') return res.json({ text: contractText() })
  res.status(404).json({ error: 'Неизвестный документ' })
})

/* ─────────────────────────  Заявки  ───────────────────────── */

const LEAD_STATUSES = ['new', 'in_progress', 'measure', 'deal', 'rejected']

adminRouter.get('/leads', (req, res) => {
  const status = String(req.query.status ?? '')
  const q = String(req.query.q ?? '').trim()
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100))
  const offset = Math.max(0, Number(req.query.offset) || 0)

  const where = []
  const args = []
  if (LEAD_STATUSES.includes(status)) {
    where.push('status = ?')
    args.push(status)
  }
  if (q) {
    where.push('(name LIKE ? OR phone LIKE ? OR comment LIKE ?)')
    args.push('%' + q + '%', '%' + q + '%', '%' + q + '%')
  }
  const sql = where.length ? ' WHERE ' + where.join(' AND ') : ''

  const rows = db
    .prepare(`SELECT * FROM leads${sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...args, limit, offset)
  const total = db.prepare(`SELECT COUNT(*) c FROM leads${sql}`).get(...args).c

  const byStatus = Object.fromEntries(
    db.prepare('SELECT status, COUNT(*) c FROM leads GROUP BY status').all().map((r) => [r.status, r.c]),
  )

  res.json({
    total,
    byStatus,
    items: rows.map((r) => ({ ...r, payload: safeJson(r.payload), utm: safeJson(r.utm) })),
  })
})

adminRouter.put('/leads/:id', (req, res) => {
  const id = Number(req.params.id)
  const fields = []
  const args = []

  if (typeof req.body?.status === 'string') {
    if (!LEAD_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'Неизвестный статус' })
    }
    fields.push('status = ?')
    args.push(req.body.status)
  }
  if (typeof req.body?.admin_note === 'string') {
    fields.push('admin_note = ?')
    args.push(req.body.admin_note.slice(0, 4000))
  }
  if (!fields.length) return res.status(400).json({ error: 'Нечего обновлять' })

  fields.push("updated_at = datetime('now')")
  const info = db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...args, id)
  if (!info.changes) return res.status(404).json({ error: 'Заявка не найдена' })

  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id)
  res.json({ ...row, payload: safeJson(row.payload), utm: safeJson(row.utm) })
})

adminRouter.delete('/leads/:id', (req, res) => {
  const info = db.prepare('DELETE FROM leads WHERE id = ?').run(Number(req.params.id))
  if (!info.changes) return res.status(404).json({ error: 'Заявка не найдена' })
  res.json({ ok: true })
})

adminRouter.get('/leads/export.csv', (_req, res) => {
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()
  const head = ['Дата', 'Имя', 'Телефон', 'Комментарий', 'Источник', 'Статус', 'Заметка', 'Расчёт']
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const lines = [head.map(esc).join(';')]

  for (const r of rows) {
    const p = safeJson(r.payload)
    const calc = p.tariff ? `${p.tariff}, ${p.area ?? '?'} м², ${p.min ?? ''}–${p.max ?? ''} ₽` : ''
    lines.push(
      [r.created_at, r.name, r.phone, r.comment, r.source, r.status, r.admin_note, calc]
        .map(esc)
        .join(';'),
    )
  }

  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set('Content-Disposition', 'attachment; filename="leads.csv"')
  // BOM, иначе Excel открывает кириллицу кракозябрами
  res.send('﻿' + lines.join('\r\n'))
})

/* ─────────────────────────  Метрика  ───────────────────────── */

adminRouter.get('/metrics', (req, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
  const since = `-${days} days`

  const daily = db
    .prepare(
      `SELECT date(created_at) AS day, type, COUNT(*) AS c
       FROM events WHERE created_at >= datetime('now', ?)
       GROUP BY day, type ORDER BY day`,
    )
    .all(since)

  const totals = Object.fromEntries(
    db
      .prepare(
        `SELECT type, COUNT(*) c FROM events WHERE created_at >= datetime('now', ?) GROUP BY type`,
      )
      .all(since)
      .map((r) => [r.type, r.c]),
  )

  const sessions = db
    .prepare(
      `SELECT COUNT(DISTINCT session_id) c FROM events
       WHERE created_at >= datetime('now', ?) AND session_id <> ''`,
    )
    .get(since).c

  const leadsCount = db
    .prepare(`SELECT COUNT(*) c FROM leads WHERE created_at >= datetime('now', ?)`)
    .get(since).c

  const leadSources = db
    .prepare(
      `SELECT source, COUNT(*) c FROM leads WHERE created_at >= datetime('now', ?)
       GROUP BY source ORDER BY c DESC LIMIT 15`,
    )
    .all(since)

  // utm и referrer лежат в JSON — раскладываем в памяти, их немного
  const raw = db
    .prepare(
      `SELECT referrer, utm FROM events
       WHERE type = 'pageview' AND created_at >= datetime('now', ?)`,
    )
    .all(since)

  const channels = new Map()
  for (const r of raw) {
    const utm = safeJson(r.utm)
    let key = utm.utm_source || hostOf(r.referrer) || 'прямой заход'
    channels.set(key, (channels.get(key) ?? 0) + 1)
  }

  res.json({
    days,
    sessions,
    leads: leadsCount,
    totals,
    conversion: totals.pageview ? +((leadsCount / totals.pageview) * 100).toFixed(2) : 0,
    daily,
    leadSources,
    channels: [...channels.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  })
})

/* ─────────────────────────  Файлы  ───────────────────────── */

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = (extname(file.originalname) || '.jpg').toLowerCase().slice(0, 8)
      cb(null, Date.now().toString(36) + '-' + randomBytes(4).toString('hex') + ext)
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Можно загружать только изображения: jpg, png, webp, avif, svg')),
})

adminRouter.get('/media', (_req, res) => {
  res.json(
    db
      .prepare('SELECT * FROM media ORDER BY created_at DESC, id DESC LIMIT 300')
      .all()
      .map((m) => ({ ...m, url: '/uploads/' + m.filename })),
  )
})

adminRouter.post('/media', upload.array('files', 20), (req, res) => {
  const stmt = db.prepare(
    'INSERT INTO media (filename, original_name, mime, size) VALUES (?, ?, ?, ?)',
  )
  const saved = (req.files ?? []).map((f) => {
    stmt.run(f.filename, f.originalname, f.mimetype, f.size)
    return { filename: f.filename, url: '/uploads/' + f.filename, size: f.size }
  })
  res.status(201).json(saved)
})

adminRouter.delete('/media/:id', async (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'Файл не найден' })
  db.prepare('DELETE FROM media WHERE id = ?').run(row.id)
  await unlink(join(UPLOAD_DIR, row.filename)).catch(() => {})
  res.json({ ok: true })
})

/* ─────────────────────────  Профиль  ───────────────────────── */

adminRouter.post('/password', (req, res) => {
  const r = changePassword(req.user.id, req.body?.current, req.body?.next)
  if (!r.ok) return res.status(400).json({ error: r.error })
  res.json({ ok: true })
})

/* ─────────────────────────  Утилиты  ───────────────────────── */

function safeJson(s) {
  try {
    const v = JSON.parse(s || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function hostOf(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
