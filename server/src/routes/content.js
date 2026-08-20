import { Router } from 'express'
import { createHash } from 'node:crypto'
import { db, getSettings } from '../db.js'

export const contentRouter = Router()

const all = (sql, ...args) => db.prepare(sql).all(...args)

/** Собирает весь контент сайта в одну структуру — ровно в том виде, в каком его ждёт фронт. */
export function buildContent() {
  const s = getSettings()

  const tariffItems = all('SELECT * FROM tariff_items ORDER BY sort, id')
  const tariffs = all('SELECT * FROM tariffs WHERE active = 1 ORDER BY sort, id').map((t) => ({
    id: t.id,
    property: t.property,
    name: t.name,
    pricePerM2: t.price_per_m2,
    withMaterials: !!t.with_materials,
    materialsPerM2: t.materials_per_m2,
    summary: t.summary,
    termFrom: t.term_from,
    termTo: t.term_to,
    popular: !!t.popular,
    includes: tariffItems.filter((i) => i.tariff_id === t.id && i.kind === 'include').map((i) => i.text),
    excludes: tariffItems.filter((i) => i.tariff_id === t.id && i.kind === 'exclude').map((i) => i.text),
  }))

  const priceItems = all('SELECT * FROM price_items ORDER BY sort, id')
  const priceGroups = all('SELECT * FROM price_groups WHERE active = 1 ORDER BY sort, id').map((g) => ({
    id: g.id,
    name: g.name,
    hint: g.hint,
    items: priceItems
      .filter((i) => i.group_id === g.id)
      .map((i) => ({ name: i.name, price: i.price, unit: i.unit, note: i.note || undefined })),
  }))

  const scope = all('SELECT * FROM work_scope ORDER BY sort, id')
  const works = all('SELECT * FROM works WHERE active = 1 ORDER BY sort, id').map((w) => ({
    id: 'w' + w.id,
    title: w.title,
    address: w.address,
    type: w.type,
    typeLabel: w.type_label,
    area: w.area,
    days: w.days,
    budget: w.budget,
    style: w.style,
    image: w.image,
    scope: scope.filter((x) => x.work_id === w.id).map((x) => x.text),
  }))

  let furnishingIncludes = []
  try {
    furnishingIncludes = JSON.parse(s.furnishingIncludes || '[]')
  } catch {
    furnishingIncludes = []
  }

  return {
    settings: {
      brand: s.brand,
      tagline: s.tagline,
      legal: s.legal,
      inn: s.inn,
      phone: s.phone,
      email: s.email,
      telegram: s.telegram,
      whatsapp: s.whatsapp,
      workHours: s.workHours,
      office: s.officeAddress
        ? { address: s.officeAddress, hours: s.officeHours, mapUrl: s.officeMapUrl }
        : null,
      yandexMetrikaId: s.yandexMetrikaId,
      sampleArea: Number(s.sampleArea) || 50,
    },
    regions: all('SELECT * FROM regions WHERE active = 1 ORDER BY sort, id').map((r) => ({
      id: r.id,
      name: r.name,
      nameIn: r.name_in,
      k: r.k,
    })),
    stats: all('SELECT * FROM stats ORDER BY sort, id').map((x) => ({
      value: x.value,
      suffix: x.suffix,
      label: x.label,
    })),
    tariffs,
    furnishingAddon: {
      name: s.furnishingName || 'Комплектация и мебель',
      pricePerM2: Number(s.furnishingPricePerM2) || 0,
      summary: s.furnishingSummary || '',
      includes: furnishingIncludes,
    },
    priceGroups,
    works,
    stageShots: all('SELECT * FROM stage_shots ORDER BY sort, id').map((x) => ({
      name: x.name,
      caption: x.caption,
      price: x.price,
      image: x.image,
    })),
    pains: all('SELECT * FROM pains ORDER BY sort, id').map((x) => ({
      problem: x.problem,
      solution: x.solution,
    })),
    processSteps: all('SELECT * FROM process_steps ORDER BY sort, id').map((x) => ({
      n: x.n,
      title: x.title,
      text: x.text,
      duration: x.duration,
    })),
    guarantees: all('SELECT * FROM guarantees ORDER BY sort, id').map((x) => ({
      title: x.title,
      text: x.text,
    })),
    promos: all('SELECT * FROM promos WHERE active = 1 ORDER BY sort, id').map((x) => ({
      title: x.title,
      text: x.text,
      badge: x.badge,
    })),
    videoReviews: all('SELECT * FROM reviews_video WHERE active = 1 ORDER BY sort, id').map((x) => ({
      id: 'v' + x.id,
      name: x.name,
      object: x.object,
      duration: x.duration,
      poster: x.poster,
      url: x.url,
    })),
    textReviews: all('SELECT * FROM reviews_text WHERE active = 1 ORDER BY sort, id').map((x) => ({
      name: x.name,
      object: x.object,
      date: x.date,
      rating: x.rating,
      text: x.text,
    })),
    faq: all('SELECT * FROM faq WHERE active = 1 ORDER BY sort, id').map((x) => ({ q: x.q, a: x.a })),
  }
}

contentRouter.get('/', (req, res) => {
  const data = buildContent()
  const body = JSON.stringify(data)
  const etag = '"' + createHash('sha1').update(body).digest('hex').slice(0, 16) + '"'

  // Контент меняется редко: браузер и CDN могут держать его минуту,
  // а ETag позволяет отдать 304 вместо повторной передачи.
  res.set('Cache-Control', 'public, max-age=60')
  res.set('ETag', etag)

  if (req.headers['if-none-match'] === etag) return res.status(304).end()
  res.type('application/json').send(body)
})
