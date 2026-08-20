import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { UPLOAD_DIR } from './db.js'
import { readSession } from './lib/auth.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { contentRouter } from './routes/content.js'
import { publicRouter } from './routes/public.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 4000

// За nginx на проде — чтобы req.ip был реальным адресом клиента, а не 127.0.0.1
app.set('trust proxy', process.env.TRUST_PROXY === '1')
app.disable('x-powered-by')

const ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5180,http://localhost:5181')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors((req, cb) => {
    const origin = req.headers.origin
    // Запросы без Origin (curl, серверные) пропускаем.
    if (!origin) return cb(null, { origin: true, credentials: true })
    // Свой же адрес — админка, которую раздаёт этот процесс.
    const sameHost = (() => {
      try {
        return new URL(origin).host === req.headers.host
      } catch {
        return false
      }
    })()
    if (sameHost || ORIGINS.includes(origin)) return cb(null, { origin: true, credentials: true })
    cb(new Error('Origin не разрешён: ' + origin))
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(readSession)

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.use('/api/content', contentRouter)
app.use('/api', publicRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }))

// Собранная админка: `npm run build` в папке admin кладёт её сюда.
// Наличие проверяем на каждом запросе, чтобы пересборка не требовала рестарта.
const adminDist = resolve(root, 'public', 'admin')
app.use('/admin', express.static(adminDist))
app.get('/admin/*', (_req, res, next) => {
  const index = resolve(adminDist, 'index.html')
  if (!existsSync(index)) {
    return res
      .status(503)
      .type('text/plain; charset=utf-8')
      .send('Админка ещё не собрана. Выполните: cd admin && npm run build')
  }
  res.sendFile(index)
})

// Публичный сайт можно раздавать этим же процессом, если положить сюда сборку
const siteDist = resolve(root, 'public', 'site')
app.use(express.static(siteDist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/admin')) {
    return next()
  }
  const index = resolve(siteDist, 'index.html')
  if (!existsSync(index)) return next()
  res.sendFile(index)
})

app.use((err, _req, res, _next) => {
  const status = err.status || (err.message?.startsWith('Origin не разрешён') ? 403 : 500)
  if (status >= 500) console.error(err)
  res.status(status).json({ error: err.message || 'Внутренняя ошибка' })
})

app.listen(PORT, () => {
  console.log('API слушает http://localhost:' + PORT)
  console.log('Разрешённые origin:', ORIGINS.join(', ') || '(нет)')
  console.log('Админка: http://localhost:' + PORT + '/admin/')
})
