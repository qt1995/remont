import PDFDocument from 'pdfkit'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, getSettings } from '../db.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const FONT = resolve(root, 'assets', 'fonts', 'Roboto-Regular.ttf')
const FONT_BOLD = resolve(root, 'assets', 'fonts', 'Roboto-Bold.ttf')

const NAVY = '#0f172a'
const GOLD = '#a16207'
const INK = '#1e293b'
const SUBTLE = '#64748b'
const LINE = '#e2e8f0'
const SAND = '#f7f4ef'

const money = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'

const today = () =>
  new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Прайс в PDF. Собирается из тех же таблиц, что и сайт, поэтому всегда актуален:
 * добавили позицию в админке — она сразу в файле.
 *
 * Важное отличие от сайта: сюда попадают ВСЕ позиции, включая скрытые
 * с витрины — ради этого разделения файл и задумывался.
 */
export function buildPricePdf({ regionId } = {}) {
  const s = getSettings()

  const region =
    db.prepare('SELECT * FROM regions WHERE id = ? AND active = 1').get(regionId ?? '') ??
    db.prepare('SELECT * FROM regions WHERE active = 1 ORDER BY sort LIMIT 1').get()

  const k = region?.k ?? 1

  const groups = db.prepare('SELECT * FROM price_groups WHERE active = 1 ORDER BY sort, id').all()
  const items = db.prepare('SELECT * FROM price_items ORDER BY sort, id').all()
  const notes = db.prepare('SELECT * FROM tariff_notes WHERE active = 1 ORDER BY sort, id').all()

  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true })
  doc.registerFont('body', FONT)
  doc.registerFont('bold', FONT_BOLD)

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const width = right - left

  // ── Шапка
  doc.rect(0, 0, doc.page.width, 96).fill(NAVY)

  doc.fill('#fff').font('bold').fontSize(20).text(s.brand, left, 26)
  doc.font('body').fontSize(10).fill('#c9d2e0').text(s.tagline, left, 52)

  doc
    .font('body')
    .fontSize(9)
    .fill('#c9d2e0')
    .text(s.phone + '   ' + s.email, left, 70, { width, align: 'left' })

  doc
    .font('body')
    .fontSize(9)
    .fill('#c9d2e0')
    .text(region ? region.name : '', left, 26, { width, align: 'right' })
  doc.text(today(), left, 40, { width, align: 'right' })

  let y = 124

  doc.font('bold').fontSize(16).fill(NAVY).text('Прайс на работы', left, y)
  y += 24

  doc
    .font('body')
    .fontSize(9)
    .fill(SUBTLE)
    .text(
      'Цены указаны за работу без стоимости материалов. Точная смета считается после замера: ' +
        'в ней те же строки, но с вашими объёмами.',
      left,
      y,
      { width },
    )
  y = doc.y + 16

  const ensureSpace = (need) => {
    if (y + need < doc.page.height - 60) return
    doc.addPage()
    y = doc.page.margins.top
  }

  // ── Группы и позиции
  for (const g of groups) {
    const rows = items.filter((i) => i.group_id === g.id)
    if (!rows.length) continue

    ensureSpace(70)

    doc.rect(left, y, width, 26).fill(SAND)
    doc.font('bold').fontSize(11).fill(NAVY).text(g.name, left + 10, y + 7, { width: width - 20 })
    y += 26

    if (g.hint) {
      doc.font('body').fontSize(8.5).fill(SUBTLE).text(g.hint, left + 10, y + 5, { width: width - 20 })
      y = doc.y + 6
    } else {
      y += 6
    }

    const colUnit = 90
    const colPrice = 90
    const colName = width - colUnit - colPrice - 20

    for (const it of rows) {
      const nameHeight = doc.font('body').fontSize(10).heightOfString(it.name, { width: colName })
      const commentHeight = it.comment
        ? doc.font('body').fontSize(8.5).heightOfString(it.comment, { width: colName })
        : 0
      const rowHeight = Math.max(20, nameHeight + commentHeight + 10)

      ensureSpace(rowHeight + 4)

      const nameFont = it.emphasis && it.emphasis.includes('bold') ? 'bold' : 'body'

      doc.font(nameFont).fontSize(10).fill(INK).text(it.name, left + 10, y + 4, { width: colName })

      if (it.comment) {
        doc
          .font('body')
          .fontSize(8.5)
          .fill(SUBTLE)
          .text(it.comment, left + 10, doc.y + 1, { width: colName })
      }

      const priceText = it.price > 0 ? 'от ' + money(it.price * k) : '—'
      doc
        .font('bold')
        .fontSize(10)
        .fill(NAVY)
        .text(priceText, left + 10 + colName, y + 4, { width: colPrice, align: 'right' })

      doc
        .font('body')
        .fontSize(9)
        .fill(SUBTLE)
        .text(it.unit, left + 20 + colName + colPrice, y + 5, { width: colUnit, align: 'right' })

      y += rowHeight
      doc.moveTo(left + 10, y).lineTo(right - 10, y).lineWidth(0.5).stroke(LINE)
    }

    y += 14
  }

  // ── Что считается отдельно
  if (notes.length) {
    ensureSpace(60 + notes.length * 30)

    doc.font('bold').fontSize(13).fill(NAVY).text('Что считается отдельно', left, y)
    y = doc.y + 10

    for (const n of notes) {
      ensureSpace(34)
      doc.font('bold').fontSize(10).fill(INK).text(n.title, left + 10, y, { width: width - 160 })
      doc
        .font('bold')
        .fontSize(10)
        .fill(GOLD)
        .text(n.value, right - 160, y, { width: 150, align: 'right' })
      y = doc.y + 2
      if (n.note) {
        doc.font('body').fontSize(8.5).fill(SUBTLE).text(n.note, left + 10, y, { width: width - 20 })
        y = doc.y
      }
      y += 10
    }
  }

  // ── Подвал на каждой странице
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    const footY = doc.page.height - 42

    doc.moveTo(left, footY - 8).lineTo(right, footY - 8).lineWidth(0.5).stroke(LINE)

    doc
      .font('body')
      .fontSize(8)
      .fill(SUBTLE)
      .text(
        s.brand + ' · ' + s.phone + ' · ' + (s.siteUrl || '').replace(/^https?:\/\//, ''),
        left,
        footY,
        { width: width / 2 },
      )

    doc
      .font('body')
      .fontSize(8)
      .fill(SUBTLE)
      .text('Стр. ' + (i + 1) + ' из ' + range.count, left + width / 2, footY, {
        width: width / 2,
        align: 'right',
      })
  }

  doc.end()
  return doc
}

/** Имя файла с датой — так в загрузках видно, насколько прайс свежий. */
export function pricePdfName() {
  const s = getSettings()
  const slug = (s.brand || 'price')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
  return 'prays-' + slug + '-' + new Date().toISOString().slice(0, 10) + '.pdf'
}
