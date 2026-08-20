import { readFileSync, statSync } from 'node:fs'
import { db, getSettings } from '../db.js'

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Абсолютный адрес: соцсети и поисковики относительные пути не принимают. */
const absolute = (base, path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return base.replace(/\/$/, '') + '/' + String(path).replace(/^\//, '')
}

function priceRange(regionK = 1) {
  const row = db
    .prepare('SELECT MIN(price_per_m2) AS min FROM tariffs WHERE active = 1')
    .get()
  if (!row?.min) return ''
  const value = Math.round(row.min * regionK)
  return 'от ' + value.toLocaleString('ru-RU') + ' ₽ за м²'
}

/** Разметка организации для поисковиков — только то, что реально заполнено. */
function jsonLd(s, base) {
  const regions = db.prepare('SELECT name FROM regions WHERE active = 1 ORDER BY sort').all()

  const data = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: s.brand,
    description: s.seoDescription,
    url: base || undefined,
    telephone: s.phone || undefined,
    email: s.email || undefined,
    image: absolute(base, s.seoOgImage) || undefined,
    priceRange: priceRange() || undefined,
    areaServed: regions.length ? regions.map((r) => ({ '@type': 'City', name: r.name })) : undefined,
  }

  if (s.officeAddress) {
    data.address = { '@type': 'PostalAddress', streetAddress: s.officeAddress }
  }

  const links = [s.telegram, s.whatsapp].filter(Boolean)
  if (links.length) data.sameAs = links

  // undefined-поля в JSON не попадают — пустых ключей в разметке не будет
  return JSON.stringify(data)
}

export function buildHead(settings) {
  const s = settings
  const base = (s.siteUrl || '').replace(/\/$/, '')
  const title = s.seoTitle || s.brand + ' — ' + s.tagline
  const description = s.seoDescription || ''
  const image = absolute(base, s.seoOgImage)
  const noindex = s.seoRobots === 'noindex'

  const tags = [
    '<meta name="description" content="' + esc(description) + '">',
    '<meta name="robots" content="' + (noindex ? 'noindex, nofollow' : 'index, follow') + '">',
    base ? '<link rel="canonical" href="' + esc(base) + '/">' : '',

    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + esc(s.brand) + '">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    base ? '<meta property="og:url" content="' + esc(base) + '/">' : '',
    image ? '<meta property="og:image" content="' + esc(image) + '">' : '',
    '<meta property="og:locale" content="ru_RU">',

    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(description) + '">',
    image ? '<meta name="twitter:image" content="' + esc(image) + '">' : '',

    s.yandexVerification
      ? '<meta name="yandex-verification" content="' + esc(s.yandexVerification) + '">'
      : '',
    s.googleVerification
      ? '<meta name="google-site-verification" content="' + esc(s.googleVerification) + '">'
      : '',

    '<script type="application/ld+json">' + jsonLd(s, base) + '</script>',
  ]

  return { title, tags: tags.filter(Boolean).join('\n    ') }
}

const cache = { key: '', html: '' }

/**
 * Подставляет метатеги в собранный index.html.
 *
 * Сайт — одностраничник, поэтому теги нельзя оставлять на откуп клиенту:
 * поисковый робот читает первый же HTML и JavaScript ждать не станет.
 */
export function renderIndex(indexPath) {
  const settings = getSettings()
  const mtime = statSync(indexPath).mtimeMs
  const key = mtime + '|' + JSON.stringify(settings)

  if (cache.key === key) return cache.html

  const raw = readFileSync(indexPath, 'utf8')
  const { title, tags } = buildHead(settings)

  // Статические теги из index.html (они нужны сборке для GitHub Pages) убираем,
  // чтобы не получить два description и два og:title на одной странице.
  let html = raw
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(title) + '</title>')
    .replace(/\s*<meta\s+name=["'](description|robots|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/\s*<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/\s*<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, '')

  html = html.replace(/<\/head>/i, '    ' + tags + '\n  </head>')

  cache.key = key
  cache.html = html
  return html
}

export function robotsTxt() {
  const s = getSettings()
  const base = (s.siteUrl || '').replace(/\/$/, '')

  if (s.seoRobots === 'noindex') {
    return 'User-agent: *\nDisallow: /\n'
  }

  return [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /api',
    'Allow: /',
    '',
    base ? 'Host: ' + base : '',
    base ? 'Sitemap: ' + base + '/sitemap.xml' : '',
    '',
  ]
    .filter((l) => l !== null)
    .join('\n')
}

export function sitemapXml() {
  const s = getSettings()
  const base = (s.siteUrl || '').replace(/\/$/, '')
  if (!base) return ''

  const lastmod = new Date().toISOString().slice(0, 10)

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n' +
    '    <loc>' + esc(base) + '/</loc>\n' +
    '    <lastmod>' + lastmod + '</lastmod>\n' +
    '    <changefreq>weekly</changefreq>\n' +
    '    <priority>1.0</priority>\n' +
    '  </url>\n' +
    '</urlset>\n'
  )
}
