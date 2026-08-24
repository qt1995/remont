/**
 * Заливка стартового контента в базу.
 *
 *   npm run seed     — заполняет только пустые таблицы (безопасно на проде)
 *   npm run reset    — очищает контентные таблицы и заливает заново
 *
 * Заявки, события и пользователи не трогаются никогда.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, setSettings } from './db.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const seed = JSON.parse(readFileSync(resolve(root, 'data', 'seed.json'), 'utf8'))

const force = process.argv.includes('--force')

const CONTENT_TABLES = [
  'tariff_notes',
  'calc_extras',
  'area_tiers',
  'hero_features',
  'partners',
  'tariff_items',
  'tariffs',
  'price_items',
  'price_groups',
  'work_scope',
  'works',
  'stage_shots',
  'pains',
  'process_steps',
  'guarantees',
  'promos',
  'reviews_text',
  'reviews_video',
  'faq',
  'stats',
  'regions',
]

const count = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c

const run = db.transaction(() => {
  if (force) {
    for (const t of CONTENT_TABLES) db.prepare(`DELETE FROM ${t}`).run()
    console.log('Контентные таблицы очищены')
  }

  if (count('regions') === 0) {
    const stmt = db.prepare(
      'INSERT INTO regions (id, name, name_in, k, sort, active) VALUES (?, ?, ?, ?, ?, 1)',
    )
    seed.regions.forEach((r, i) => stmt.run(r.id, r.name, r.nameIn, r.k, r.sort ?? i))
  }

  if (count('stats') === 0) {
    const stmt = db.prepare('INSERT INTO stats (value, suffix, label, sort) VALUES (?, ?, ?, ?)')
    seed.stats.forEach((s, i) => stmt.run(s.value, s.suffix ?? '', s.label, i))
  }

  if (count('tariffs') === 0) {
    const t = db.prepare(`INSERT INTO tariffs
      (id, property, name, price_per_m2, with_materials, materials_per_m2, summary, term_from, term_to, popular, sort, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
    const item = db.prepare(
      'INSERT INTO tariff_items (tariff_id, kind, text, sort) VALUES (?, ?, ?, ?)',
    )
    seed.tariffs.forEach((x, i) => {
      t.run(
        x.id,
        x.property,
        x.name,
        x.pricePerM2,
        x.withMaterials ? 1 : 0,
        x.materialsPerM2 ?? 0,
        x.summary ?? '',
        x.termFrom,
        x.termTo,
        x.popular ? 1 : 0,
        i,
      )
      ;(x.includes ?? []).forEach((s, j) => item.run(x.id, 'include', s, j))
      ;(x.excludes ?? []).forEach((s, j) => item.run(x.id, 'exclude', s, j))
    })

    // Комплектация мебелью — отдельная опция, живёт как настройка
    setSettings({
      furnishingName: seed.furnishingAddon.name,
      furnishingPricePerM2: seed.furnishingAddon.pricePerM2,
      furnishingSummary: seed.furnishingAddon.summary,
      furnishingIncludes: JSON.stringify(seed.furnishingAddon.includes ?? []),
    })
  }

  if (count('price_groups') === 0) {
    const g = db.prepare('INSERT INTO price_groups (id, name, hint, sort, active) VALUES (?, ?, ?, ?, 1)')
    const it = db.prepare(
      'INSERT INTO price_items (group_id, name, price, unit, note, sort) VALUES (?, ?, ?, ?, ?, ?)',
    )
    seed.priceGroups.forEach((x, i) => {
      g.run(x.id, x.name, x.hint ?? '', i)
      x.items.forEach((p, j) => it.run(x.id, p.name, p.price, p.unit, p.note ?? '', j))
    })
  }

  if (count('works') === 0) {
    const w = db.prepare(`INSERT INTO works
      (title, address, type, type_label, area, days, budget, style, image, sort, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
    const sc = db.prepare('INSERT INTO work_scope (work_id, text, sort) VALUES (?, ?, ?)')
    seed.works.forEach((x, i) => {
      const { lastInsertRowid } = w.run(
        x.title,
        x.address ?? '',
        x.type,
        x.typeLabel ?? '',
        x.area,
        x.days,
        x.budget,
        x.style ?? '',
        x.image ?? '',
        i,
      )
      ;(x.scope ?? []).forEach((s, j) => sc.run(lastInsertRowid, s, j))
    })
  }

  if (count('stage_shots') === 0) {
    const stmt = db.prepare(
      'INSERT INTO stage_shots (name, caption, price, image, sort) VALUES (?, ?, ?, ?, ?)',
    )
    seed.stageShots.forEach((s, i) => stmt.run(s.name, s.caption, s.price, s.image, i))
  }

  if (count('pains') === 0) {
    const stmt = db.prepare('INSERT INTO pains (problem, solution, sort) VALUES (?, ?, ?)')
    seed.pains.forEach((p, i) => stmt.run(p.problem, p.solution, i))
  }

  if (count('process_steps') === 0) {
    const stmt = db.prepare(
      'INSERT INTO process_steps (n, title, text, duration, sort) VALUES (?, ?, ?, ?, ?)',
    )
    seed.processSteps.forEach((s, i) => stmt.run(s.n, s.title, s.text, s.duration, i))
  }

  if (count('guarantees') === 0) {
    const stmt = db.prepare('INSERT INTO guarantees (title, text, sort) VALUES (?, ?, ?)')
    seed.guarantees.forEach((g, i) => stmt.run(g.title, g.text, i))
  }

  if (count('promos') === 0) {
    const stmt = db.prepare('INSERT INTO promos (title, text, badge, sort, active) VALUES (?, ?, ?, ?, 1)')
    seed.promos.forEach((p, i) => stmt.run(p.title, p.text, p.badge ?? '', i))
  }

  if (count('reviews_text') === 0) {
    const stmt = db.prepare(
      'INSERT INTO reviews_text (name, object, date, rating, text, sort, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    )
    seed.textReviews.forEach((r, i) => stmt.run(r.name, r.object, r.date, r.rating, r.text, i))
  }

  if (count('reviews_video') === 0) {
    const stmt = db.prepare(
      'INSERT INTO reviews_video (name, object, duration, poster, url, sort, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    )
    seed.videoReviews.forEach((r, i) =>
      stmt.run(r.name, r.object, r.duration, '/portfolio/work-' + ((i % 6) + 1) + '.svg', '', i),
    )
  }

  if (count('tariff_notes') === 0) {
    const stmt = db.prepare(
      'INSERT INTO tariff_notes (title, value, note, sort, active) VALUES (?, ?, ?, ?, 1)',
    )
    const notes = [
      [
        'Черновые материалы',
        'в среднем 5 000 ₽/м²',
        'Считаются отдельно от работ: смеси, профиль, гипсокартон, трубы, кабель, стяжка.',
      ],
      [
        'Чистовые материалы',
        'от 5 000 ₽/м²',
        'Плитка, ламинат, обои, сантехника, двери. Выбираете сами — бюджет зависит от вкуса.',
      ],
      ['Дизайн-проект', '3 000 ₽/м²', 'Планировочное решение и рабочие чертежи, без 3D.'],
      ['Дизайн-проект с 3D', '4 000 ₽/м²', 'То же плюс визуализация каждой комнаты.'],
    ]
    notes.forEach((n, i) => stmt.run(n[0], n[1], n[2], i))
  }

  if (count('calc_extras') === 0) {
    const stmt = db.prepare(
      'INSERT INTO calc_extras (id, label, hint, kind, amount, sort, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    )
    const extras = [
      ['design', 'Дизайн-проект', 'Планировка и рабочие чертежи, без 3D', 'per_m2', 3000],
      ['design3d', 'Дизайн-проект с 3D', 'То же плюс визуализация каждой комнаты', 'per_m2', 4000],
      ['furniture', 'Мебель и комплектация', 'Подбор, закупка, доставка и сборка', 'per_m2', 10000],
      ['kitchen', 'Кухня на заказ', 'Проект, изготовление и монтаж', 'fixed', 250000],
      ['warmFloor', 'Тёплые полы', 'Электрический контур с терморегулятором', 'per_bath', 26000],
      ['smartLight', 'Сценарный свет', 'Диммеры, подсветка ниш, управление со смартфона', 'per_m2', 1200],
    ]
    extras.forEach((e, i) => stmt.run(e[0], e[1], e[2], e[3], e[4], i))
  }

  if (count('area_tiers') === 0) {
    const stmt = db.prepare('INSERT INTO area_tiers (area_from, k, label, sort) VALUES (?, ?, ?, ?)')
    const tiers = [
      [0, 1.1, 'Маленький объём — выезды и логистика те же, а метров меньше'],
      [40, 1, 'Базовый объём'],
      [80, 0.95, 'Большая площадь — работаем дешевле за метр'],
      [120, 0.9, 'Очень большая площадь'],
    ]
    tiers.forEach((t, i) => stmt.run(t[0], t[1], t[2], i))
  }

  if (count('hero_features') === 0) {
    const stmt = db.prepare('INSERT INTO hero_features (icon, title, text, sort) VALUES (?, ?, ?, ?)')
    const items = [
      ['file', 'Фиксированная смета', 'Сумма из договора не растёт по ходу работ'],
      ['clock', 'Штраф за просрочку', 'Сдвинули срок по своей вине — вычитаем из суммы'],
      ['shield', 'Гарантия 2 года', 'На работы и на инженерные системы'],
      ['ruler', 'Замер бесплатно', 'Приедем, обмерим и посчитаем без обязательств'],
    ]
    items.forEach((x, i) => stmt.run(x[0], x[1], x[2], i))
  }

  if (count('partners') === 0) {
    const stmt = db.prepare(
      'INSERT INTO partners (name, note, logo, url, sort, active) VALUES (?, ?, ?, ?, ?, 1)',
    )
    // Заглушки: заменить на реальных поставщиков в админке
    const items = [
      ['Поставщик плитки', 'Склад в городе, отгрузка день в день', '', ''],
      ['Поставщик сантехники', 'Гарантия и сервис по всей линейке', '', ''],
      ['Салон дверей', 'Замер и монтаж в один визит', '', ''],
      ['Мебельная фабрика', 'Кухни и шкафы на заказ', '', ''],
    ]
    items.forEach((x, i) => stmt.run(x[0], x[1], x[2], x[3], i))
  }

  if (count('faq') === 0) {
    const stmt = db.prepare('INSERT INTO faq (q, a, sort, active) VALUES (?, ?, ?, 1)')
    seed.faq.forEach((f, i) => stmt.run(f.q, f.a, i))
  }
})

run()

// Администратор создаётся один раз. Пароль берём из окружения или генерируем.
const users = db.prepare('SELECT COUNT(*) c FROM users').get().c
if (users === 0) {
  const login = process.env.ADMIN_LOGIN || 'admin'
  const password =
    process.env.ADMIN_PASSWORD || Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)
  db.prepare('INSERT INTO users (login, password_hash, name) VALUES (?, ?, ?)').run(
    login,
    bcrypt.hashSync(password, 10),
    'Администратор',
  )
  console.log('\n=== Доступ в админку ===')
  console.log('  логин:  ' + login)
  console.log('  пароль: ' + password)
  console.log('Сохраните — пароль больше не показывается.\n')
}

console.log('Готово. Содержимое базы:')
for (const t of [...CONTENT_TABLES, 'leads', 'events', 'users']) {
  console.log('  ' + t.padEnd(16) + count(t))
}
