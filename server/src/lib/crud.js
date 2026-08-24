import { Router } from 'express'
import { db } from '../db.js'

/**
 * Ошибки SQLite наружу уходят как 400 с человеческим текстом: молчаливый 500
 * в админке выглядит так, будто «просто не сохраняется».
 */
function handle(res, fn) {
  try {
    return fn()
  } catch (e) {
    const message = String(e?.message ?? e)
    if (message.includes('CHECK constraint')) {
      return res.status(400).json({
        error: 'Одно из полей заполнено недопустимым значением — проверьте выпадающие списки в строках',
      })
    }
    if (message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Запись с таким идентификатором уже есть' })
    }
    if (message.includes('NOT NULL')) {
      return res.status(400).json({ error: 'Не заполнено обязательное поле' })
    }
    console.error('[crud]', e)
    return res.status(400).json({ error: 'Не удалось сохранить: ' + message })
  }
}

const cast = (type, value) => {
  if (type === 'int') return Math.trunc(Number(value) || 0)
  if (type === 'real') return Number(value) || 0
  if (type === 'bool') return value ? 1 : 0
  return value === null || value === undefined ? '' : String(value)
}

/**
 * Роутер CRUD для одной таблицы. Админка работает с полями как они лежат в базе —
 * без переименований, чтобы не держать два словаря названий.
 *
 * child — вложенный список (позиции прайса, пункты тарифа): приходит и сохраняется
 * вместе с родителем одним запросом, чтобы в интерфейсе была одна кнопка «Сохранить».
 */
export function crudRouter({ table, columns, idColumn = 'id', idType = 'int', child = null }) {
  const router = Router()
  const names = columns.map((c) => c.name)

  const pick = (body) => {
    const out = {}
    for (const c of columns) {
      if (Object.hasOwn(body ?? {}, c.name)) out[c.name] = cast(c.type, body[c.name])
    }
    return out
  }

  const loadChildren = (parentId) =>
    child
      ? db
          .prepare(`SELECT * FROM ${child.table} WHERE ${child.fk} = ? ORDER BY sort, id`)
          .all(parentId)
      : undefined

  const saveChildren = (parentId, rows) => {
    if (!child || !Array.isArray(rows)) return
    db.prepare(`DELETE FROM ${child.table} WHERE ${child.fk} = ?`).run(parentId)
    const cols = child.columns.map((c) => c.name)
    const stmt = db.prepare(
      `INSERT INTO ${child.table} (${child.fk}, ${cols.join(', ')}, sort)
       VALUES (?, ${cols.map(() => '?').join(', ')}, ?)`,
    )
    rows.forEach((row, i) => {
      stmt.run(parentId, ...child.columns.map((c) => cast(c.type, row?.[c.name])), i)
    })
  }

  router.get('/', (_req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY sort, ${idColumn}`).all()
    if (child) for (const r of rows) r.items = loadChildren(r[idColumn])
    res.json(rows)
  })

  router.post('/', (req, res) =>
    handle(res, () => {
    const data = pick(req.body)

    if (idType === 'text') {
      const id = String(req.body?.[idColumn] ?? '').trim()
      if (!id) return res.status(400).json({ error: 'Нужен идентификатор (латиницей, без пробелов)' })
      if (db.prepare(`SELECT 1 FROM ${table} WHERE ${idColumn} = ?`).get(id)) {
        return res.status(409).json({ error: 'Запись с таким идентификатором уже есть' })
      }
      data[idColumn] = id
    }

    if (!Object.hasOwn(data, 'sort')) {
      data.sort = (db.prepare(`SELECT COALESCE(MAX(sort), -1) m FROM ${table}`).get().m ?? -1) + 1
    }

    const keys = Object.keys(data)
    const tx = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        )
        .run(...keys.map((k) => data[k]))
      const id = idType === 'text' ? data[idColumn] : info.lastInsertRowid
      saveChildren(id, req.body?.items)
      return id
    })

    const id = tx()
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(id)
    if (child) row.items = loadChildren(id)
    res.status(201).json(row)
    }),
  )

  router.put('/:id', (req, res) =>
    handle(res, () => {
    const id = idType === 'text' ? req.params.id : Number(req.params.id)
    const exists = db.prepare(`SELECT 1 FROM ${table} WHERE ${idColumn} = ?`).get(id)
    if (!exists) return res.status(404).json({ error: 'Запись не найдена' })

    const data = pick(req.body)
    const keys = Object.keys(data).filter((k) => k !== idColumn)

    const tx = db.transaction(() => {
      if (keys.length) {
        db.prepare(
          `UPDATE ${table} SET ${keys.map((k) => k + ' = ?').join(', ')} WHERE ${idColumn} = ?`,
        ).run(...keys.map((k) => data[k]), id)
      }
      saveChildren(id, req.body?.items)
    })

    tx()
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(id)
    if (child) row.items = loadChildren(id)
    res.json(row)
    }),
  )

  router.delete('/:id', (req, res) => {
    const id = idType === 'text' ? req.params.id : Number(req.params.id)
    const info = db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`).run(id)
    if (!info.changes) return res.status(404).json({ error: 'Запись не найдена' })
    res.json({ ok: true })
  })

  router.post('/reorder', (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
    const stmt = db.prepare(`UPDATE ${table} SET sort = ? WHERE ${idColumn} = ?`)
    const tx = db.transaction(() => {
      ids.forEach((id, i) => stmt.run(i, idType === 'text' ? String(id) : Number(id)))
    })
    tx()
    res.json({ ok: true })
  })

  router.__columns = names
  return router
}
