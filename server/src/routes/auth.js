import { Router } from 'express'
import { clearSession, issueSession, requireAuth, verifyUser } from '../lib/auth.js'
import { rateLimit } from '../lib/rateLimit.js'

export const authRouter = Router()

authRouter.post(
  '/login',
  rateLimit({ windowMs: 15 * 60_000, max: 10, message: 'Слишком много попыток входа. Подождите.' }),
  (req, res) => {
    const user = verifyUser(req.body?.login, req.body?.password)
    if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' })
    issueSession(res, user)
    res.json({ user })
  },
)

authRouter.post('/logout', (_req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})
