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
    priceFrom: !!t.price_from,
    materialsNote: t.materials_note,
    includes: tariffItems
      .filter((i) => i.tariff_id === t.id && i.kind === 'include')
      .map((i) => ({ text: i.text, emphasis: i.emphasis || undefined })),
    excludes: tariffItems
      .filter((i) => i.tariff_id === t.id && i.kind === 'exclude')
      .map((i) => ({ text: i.text, emphasis: i.emphasis || undefined })),
  }))

  const priceItems = all('SELECT * FROM price_items ORDER BY sort, id')
  const defaultLimit = Number(s.priceVisibleLimit) || 0

  const priceGroups = all('SELECT * FROM price_groups WHERE active = 1 ORDER BY sort, id').map((g) => {
    // Скрытые строки на сайт не уходят вовсе, но остаются в PDF
    const visible = priceItems.filter((i) => i.group_id === g.id && i.active)
    const limit = g.visible_limit > 0 ? g.visible_limit : defaultLimit
    const shown = limit > 0 ? visible.slice(0, limit) : visible
    const total = priceItems.filter((i) => i.group_id === g.id).length

    return {
      id: g.id,
      name: g.name,
      hint: g.hint,
      total,
      hidden: total - shown.length,
      items: shown.map((i) => ({
        name: i.name,
        price: i.price,
        unit: i.unit,
        note: i.note || undefined,
        comment: i.comment || undefined,
        emphasis: i.emphasis || undefined,
      })),
    }
  })

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
      heroTariffA: s.heroTariffA,
      heroTariffB: s.heroTariffB,
      heroPriceLabelA: s.heroPriceLabelA,
      heroPriceLabelB: s.heroPriceLabelB,
      calcRoomK: Number(s.calcRoomK) || 0,
      calcBathK: Number(s.calcBathK) || 0,
      calcSpread: Number(s.calcSpread) || 10,
      calcMaterialsLabel: s.calcMaterialsLabel,
      calcMaterialsHint: s.calcMaterialsHint,
      pricePdfNote: s.pricePdfNote,
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

    tariffNotes: all('SELECT * FROM tariff_notes WHERE active = 1 ORDER BY sort, id').map((x) => ({
      title: x.title,
      value: x.value,
      note: x.note,
    })),
    calcExtras: all('SELECT * FROM calc_extras WHERE active = 1 ORDER BY sort, id').map((x) => ({
      id: x.id,
      label: x.label,
      hint: x.hint,
      kind: x.kind,
      amount: x.amount,
    })),
    areaTiers: all('SELECT * FROM area_tiers ORDER BY area_from').map((x) => ({
      areaFrom: x.area_from,
      k: x.k,
      label: x.label,
    })),
    heroFeatures: all('SELECT * FROM hero_features ORDER BY sort, id').map((x) => ({
      icon: x.icon,
      title: x.title,
      text: x.text,
    })),
    partners: all('SELECT * FROM partners WHERE active = 1 ORDER BY sort, id').map((x) => ({
      name: x.name,
      note: x.note,
      logo: x.logo,
      url: x.url,
    })),
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
