/**
 * Простой ограничитель по IP в памяти процесса.
 * Для одного сервера этого достаточно; при нескольких инстансах нужен Redis.
 */
const buckets = new Map()

export function rateLimit({ windowMs = 60_000, max = 30, message = 'Слишком много запросов' } = {}) {
  return (req, res, next) => {
    const key = (req.ip || 'unknown') + ':' + req.baseUrl
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || now > bucket.reset) {
      buckets.set(key, { count: 1, reset: now + windowMs })
      return next()
    }

    bucket.count += 1
    if (bucket.count > max) {
      const retry = Math.ceil((bucket.reset - now) / 1000)
      res.set('Retry-After', String(retry))
      return res.status(429).json({ error: message, retryAfter: retry })
    }
    next()
  }
}

// Чтобы карта не росла бесконечно на долгоживущем процессе.
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k)
}, 60_000).unref()
