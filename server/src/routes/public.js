import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { notifyLead } from '../lib/telegram.js'
import { rateLimit } from '../lib/rateLimit.js'
import { buildPricePdf, pricePdfName } from '../lib/pdf.js'

export const publicRouter = Router()

const digits = (s) => String(s ?? '').replace(/\D/g, '')

const leadSchema = z.object({
  name: z.string().trim().max(120).default(''),
  phone: z.string().trim().min(1, 'Укажите телефон'),
  comment: z.string().trim().max(2000).default(''),
  source: z.string().trim().max(120).default(''),
  payload: z.record(z.any()).default({}),
  utm: z.record(z.string()).default({}),
  page: z.string().trim().max(500).default(''),
  // honeypot: настоящий человек это поле не видит и не заполняет.
  // Валидацию не заваливаем — боту отвечаем «принято», но в базу не пишем.
  website: z.string().max(500).optional(),
})

publicRouter.post(
  '/leads',
  rateLimit({ windowMs: 60_000, max: 5, message: 'Слишком часто. Попробуйте через минуту.' }),
  async (req, res) => {
    const parsed = leadSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Неверные данные' })
    }

    const data = parsed.data

    if (data.website) return res.json({ ok: true }) // бот — отвечаем успехом, но не сохраняем

    if (digits(data.phone).length !== 11) {
      return res.status(400).json({ error: 'Телефон должен содержать 11 цифр' })
    }

    const info = db
      .prepare(
        `INSERT INTO leads (name, phone, comment, source, payload, utm, page, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.phone,
        data.comment,
        data.source,
        JSON.stringify(data.payload),
        JSON.stringify(data.utm),
        data.page,
        req.ip ?? '',
      )

    const lead = { ...data, id: info.lastInsertRowid }

    db.prepare('INSERT INTO events (type, path, utm, meta) VALUES (?, ?, ?, ?)').run(
      'lead',
      data.page,
      JSON.stringify(data.utm),
      JSON.stringify({ source: data.source, leadId: info.lastInsertRowid }),
    )

    // Ответ не ждёт Telegram: клиенту важно быстро увидеть «принято».
    res.json({ ok: true, id: info.lastInsertRowid })
    notifyLead(lead).catch(() => {})
  },
)

const eventSchema = z.object({
  type: z.string().trim().min(1).max(40),
  sessionId: z.string().trim().max(64).default(''),
  path: z.string().trim().max(500).default(''),
  referrer: z.string().trim().max(500).default(''),
  utm: z.record(z.string()).default({}),
  meta: z.record(z.any()).default({}),
})

publicRouter.post(
  '/track',
  rateLimit({ windowMs: 60_000, max: 120, message: 'Слишком много событий' }),
  (req, res) => {
    const list = Array.isArray(req.body) ? req.body : [req.body]
    const stmt = db.prepare(
      'INSERT INTO events (type, session_id, path, referrer, utm, meta) VALUES (?, ?, ?, ?, ?, ?)',
    )

    const tx = db.transaction((rows) => {
      for (const raw of rows) {
        const p = eventSchema.safeParse(raw ?? {})
        if (!p.success) continue
        const e = p.data
        stmt.run(e.type, e.sessionId, e.path, e.referrer, JSON.stringify(e.utm), JSON.stringify(e.meta))
      }
    })

    tx(list.slice(0, 20))
    res.status(204).end()
  },
)

/**
 * Прайс в PDF. Формируется на лету из базы — файл нигде не лежит и не устаревает.
 * Скачивается по кнопке с сайта; заодно отмечаем событие в своей статистике.
 */
publicRouter.get(
  '/price.pdf',
  rateLimit({ windowMs: 60_000, max: 20, message: 'Слишком часто' }),
  (req, res) => {
    db.prepare('INSERT INTO events (type, path, meta) VALUES (?, ?, ?)').run(
      'price_pdf',
      '/',
      JSON.stringify({ region: req.query.region ?? '' }),
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="' + pricePdfName() + '"')

    const doc = buildPricePdf({ regionId: String(req.query.region ?? '') })
    doc.pipe(res)
  },
)
