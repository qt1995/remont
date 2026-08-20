/**
 * Выгружает стартовый контент сайта (src/data/*.ts) в server/data/seed.json.
 *
 * Нужно, чтобы у базы и у фолбэка на фронте был один источник правды: правим
 * тексты в src/data — прогоняем этот скрипт — заливаем в базу через npm run seed.
 */
import { build } from 'esbuild'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const tmp = resolve(root, 'node_modules', '.cache', 'seed')
const entry = resolve(tmp, 'entry.ts')
const out = resolve(tmp, 'bundle.mjs')

mkdirSync(tmp, { recursive: true })

writeFileSync(
  entry,
  `
export { tariffs, furnishingAddon } from ${JSON.stringify(resolve(root, 'src/data/tariffs.ts'))}
export { priceGroups } from ${JSON.stringify(resolve(root, 'src/data/priceList.ts'))}
export { works } from ${JSON.stringify(resolve(root, 'src/data/portfolio.ts'))}
export { pains, stages, guarantees, promos, videoReviews, textReviews, faq } from ${JSON.stringify(
    resolve(root, 'src/data/content.ts'),
  )}
export { stats } from ${JSON.stringify(resolve(root, 'src/config/site.ts'))}
`,
)

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
  // site.ts тянет import.meta.env — на этапе выгрузки его нет
  define: { 'import.meta.env.VITE_LEAD_ENDPOINT': '""' },
})

const data = await import(pathToFileURL(out).href)

// Стоимость материалов на м² по уровням отделки — сейчас живёт в src/lib/calc.ts,
// после переезда на базу редактируется вместе с тарифом.
const MATERIALS_PER_M2 = {
  'new-rough': 3500,
  'new-prefinish': 5200,
  'new-turnkey': 9500,
  'new-turnkey-materials': 0,
  'old-cosmetic': 3200,
  'old-capital': 7800,
  'old-euro': 11000,
}

const seed = {
  tariffs: data.tariffs.map((t) => ({ ...t, materialsPerM2: MATERIALS_PER_M2[t.id] ?? 0 })),
  furnishingAddon: data.furnishingAddon,
  priceGroups: data.priceGroups,
  works: data.works,
  pains: data.pains,
  processSteps: data.stages,
  guarantees: data.guarantees,
  promos: data.promos,
  videoReviews: data.videoReviews,
  textReviews: data.textReviews,
  faq: data.faq,
  stats: data.stats,
  stageShots: [
    {
      name: 'Черновая',
      caption: 'Стены под штукатурку, стяжка, разводка электрики и сантехники.',
      price: 'от 4 900 ₽/м²',
      image: '/stages/1-draft.svg',
    },
    {
      name: 'Чистовая',
      caption: 'Финишная отделка, полы, двери, свет, сантехника. Можно заезжать.',
      price: 'от 9 900 ₽/м²',
      image: '/stages/2-finish.svg',
    },
    {
      name: 'С мебелью',
      caption: 'Подбор, закупка и сборка мебели, света и текстиля под дизайн-проект.',
      price: '+10 000 ₽/м²',
      image: '/stages/3-furnished.svg',
    },
  ],
  regions: [
    { id: 'tyumen', name: 'Тюмень', nameIn: 'Тюмени', k: 1, sort: 0 },
    { id: 'moscow', name: 'Москва', nameIn: 'Москве', k: 1.75, sort: 1 },
  ],
}

const dest = resolve(root, 'server', 'data', 'seed.json')
mkdirSync(resolve(root, 'server', 'data'), { recursive: true })
writeFileSync(dest, JSON.stringify(seed, null, 2), 'utf8')
rmSync(tmp, { recursive: true, force: true })

console.log('seed.json записан:', dest)
for (const [k, v] of Object.entries(seed)) {
  console.log('  ' + k + ':', Array.isArray(v) ? v.length + ' шт.' : 'объект')
}
