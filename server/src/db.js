import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
export const DB_PATH = process.env.DB_PATH ?? resolve(root, 'data', 'app.db')
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? resolve(root, 'uploads')

mkdirSync(dirname(DB_PATH), { recursive: true })
mkdirSync(UPLOAD_DIR, { recursive: true })

export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/**
 * Схема. Всё содержимое сайта лежит в таблицах, публичный эндпоинт /api/content
 * собирает из них один JSON — фронт больше ничего не знает про базу.
 */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  login         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS regions (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  name_in TEXT NOT NULL,
  k       REAL NOT NULL DEFAULT 1,
  sort    INTEGER NOT NULL DEFAULT 0,
  active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stats (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  value  TEXT NOT NULL,
  suffix TEXT NOT NULL DEFAULT '',
  label  TEXT NOT NULL,
  sort   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tariffs (
  id             TEXT PRIMARY KEY,
  property       TEXT NOT NULL CHECK (property IN ('new','old')),
  name           TEXT NOT NULL,
  price_per_m2   INTEGER NOT NULL,
  with_materials INTEGER NOT NULL DEFAULT 0,
  materials_per_m2 INTEGER NOT NULL DEFAULT 0,
  summary        TEXT NOT NULL DEFAULT '',
  term_from      INTEGER NOT NULL DEFAULT 30,
  term_to        INTEGER NOT NULL DEFAULT 60,
  popular        INTEGER NOT NULL DEFAULT 0,
  sort           INTEGER NOT NULL DEFAULT 0,
  active         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tariff_items (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  tariff_id TEXT NOT NULL REFERENCES tariffs(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL CHECK (kind IN ('include','exclude')),
  text      TEXT NOT NULL,
  sort      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS price_groups (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  hint   TEXT NOT NULL DEFAULT '',
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS price_items (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL REFERENCES price_groups(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  price    INTEGER NOT NULL,
  unit     TEXT NOT NULL DEFAULT 'м²',
  note     TEXT NOT NULL DEFAULT '',
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS works (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  address    TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT 'new',
  type_label TEXT NOT NULL DEFAULT '',
  area       INTEGER NOT NULL DEFAULT 0,
  days       INTEGER NOT NULL DEFAULT 0,
  budget     INTEGER NOT NULL DEFAULT 0,
  style      TEXT NOT NULL DEFAULT '',
  image      TEXT NOT NULL DEFAULT '',
  sort       INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS work_scope (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  text    TEXT NOT NULL,
  sort    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stage_shots (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  price   TEXT NOT NULL DEFAULT '',
  image   TEXT NOT NULL DEFAULT '',
  sort    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pains (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  problem  TEXT NOT NULL,
  solution TEXT NOT NULL,
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS process_steps (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  n        TEXT NOT NULL,
  title    TEXT NOT NULL,
  text     TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guarantees (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  text  TEXT NOT NULL DEFAULT '',
  sort  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS promos (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  title  TEXT NOT NULL,
  text   TEXT NOT NULL DEFAULT '',
  badge  TEXT NOT NULL DEFAULT '',
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reviews_text (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL,
  object TEXT NOT NULL DEFAULT '',
  date   TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  text   TEXT NOT NULL,
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reviews_video (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  object   TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  poster   TEXT NOT NULL DEFAULT '',
  url      TEXT NOT NULL DEFAULT '',
  sort     INTEGER NOT NULL DEFAULT 0,
  active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS faq (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  q      TEXT NOT NULL,
  a      TEXT NOT NULL,
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL,
  comment    TEXT NOT NULL DEFAULT '',
  source     TEXT NOT NULL DEFAULT '',
  payload    TEXT NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'new',
  admin_note TEXT NOT NULL DEFAULT '',
  utm        TEXT NOT NULL DEFAULT '{}',
  page       TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  path       TEXT NOT NULL DEFAULT '',
  referrer   TEXT NOT NULL DEFAULT '',
  utm        TEXT NOT NULL DEFAULT '{}',
  meta       TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type    ON events(type, created_at DESC);

CREATE TABLE IF NOT EXISTS tariff_notes (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  title  TEXT NOT NULL,
  value  TEXT NOT NULL DEFAULT '',
  note   TEXT NOT NULL DEFAULT '',
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS calc_extras (
  id     TEXT PRIMARY KEY,
  label  TEXT NOT NULL,
  hint   TEXT NOT NULL DEFAULT '',
  kind   TEXT NOT NULL DEFAULT 'per_m2' CHECK (kind IN ('per_m2','fixed','per_bath')),
  amount INTEGER NOT NULL DEFAULT 0,
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS area_tiers (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  area_from INTEGER NOT NULL DEFAULT 0,
  k         REAL NOT NULL DEFAULT 1,
  label     TEXT NOT NULL DEFAULT '',
  sort      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hero_features (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  icon  TEXT NOT NULL DEFAULT 'shield',
  title TEXT NOT NULL,
  text  TEXT NOT NULL DEFAULT '',
  sort  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partners (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL,
  note   TEXT NOT NULL DEFAULT '',
  logo   TEXT NOT NULL DEFAULT '',
  url    TEXT NOT NULL DEFAULT '',
  sort   INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  filename      TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL DEFAULT '',
  mime          TEXT NOT NULL DEFAULT '',
  size          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

/**
 * Дозаливка столбцов в уже существующие таблицы.
 * SQLite не умеет ADD COLUMN IF NOT EXISTS, поэтому сверяемся с pragma.
 */
function addColumn(table, column, definition) {
  const has = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)
  if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

// Строку прайса можно скрыть с сайта, оставив в PDF; к ней можно дать комментарий
addColumn('price_items', 'comment', "TEXT NOT NULL DEFAULT ''")
addColumn('price_items', 'active', 'INTEGER NOT NULL DEFAULT 1')
addColumn('price_items', 'emphasis', "TEXT NOT NULL DEFAULT ''")

// Сколько позиций показывать на сайте: 0 — все, остальные уходят в PDF
addColumn('price_groups', 'visible_limit', 'INTEGER NOT NULL DEFAULT 0')

// «от 4 900 ₽/м²» против фиксированной цены + оговорка про материалы
addColumn('tariffs', 'price_from', 'INTEGER NOT NULL DEFAULT 1')
addColumn('tariffs', 'materials_note', "TEXT NOT NULL DEFAULT ''")
addColumn('tariff_items', 'emphasis', "TEXT NOT NULL DEFAULT ''")

/** Значения настроек по умолчанию — создаются один раз, потом правятся из админки. */
export const DEFAULT_SETTINGS = {
  brand: 'ПРО Комфорт',
  tagline: 'Ремонт квартир под ключ',
  legal: 'ИП Иванов И. И.',
  inn: '000000000000',
  phone: '+7 (000) 000-00-00',
  email: 'hello@example.ru',
  telegram: 'https://t.me/example',
  whatsapp: 'https://wa.me/70000000000',
  workHours: 'Пн–Сб, 9:00–20:00',
  officeAddress: '',
  officeHours: '',
  officeMapUrl: '',
  yandexMetrikaId: '',
  telegramBotToken: '',
  telegramChatId: '',
  telegramNotify: '1',
  sampleArea: '50',

  // SEO — правится в админке, подставляется в HTML на сервере
  siteUrl: 'https://pro-comfort.pro',
  seoTitle: 'ПРО Комфорт — ремонт квартир под ключ',
  seoDescription:
    'Ремонт квартир под ключ с фиксированной сметой: прозрачный прайс на каждый вид работ, ' +
    'договор со штрафом за просрочку, гарантия 5 лет. Расчёт стоимости за 60 секунд.',
  seoOgImage: '/og-cover.svg',
  seoRobots: 'index',
  yandexVerification: '',
  googleVerification: '',

  // Главный экран: какие тарифы показывать ценой. Пусто — выбираются автоматически.
  heroTariffA: '',
  heroTariffB: '',
  heroPriceLabelA: '',
  heroPriceLabelB: '',

  // Калькулятор: насколько каждая лишняя комната и санузел усложняют работу
  calcRoomK: '2',
  calcBathK: '6',
  calcSpread: '10',
  calcMaterialsLabel: 'Черновые материалы',
  calcMaterialsHint:
    'Чистовые материалы (плитка, ламинат, обои, сантехника) считаются отдельно — их выбираете вы.',

  // Прайс: сколько позиций в группе показывать на сайте по умолчанию
  // Пусто — используется встроенный шаблон документа
  privacyText: '',
  contractText: '',
  cookieNotice: '1',

  priceVisibleLimit: '10',
  pricePdfNote: 'Полный прайс со всеми позициями — в PDF по кнопке ниже.',
}

const insertSetting = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
)

for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(key, value)

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const out = { ...DEFAULT_SETTINGS }
  for (const r of rows) out[r.key] = r.value
  return out
}

export function setSettings(patch) {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  )
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) stmt.run(k, String(v ?? ''))
  })
  tx(Object.entries(patch))
  return getSettings()
}
