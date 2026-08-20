import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'

export const COOKIE = 'remont_session'
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const MAX_AGE = 1000 * 60 * 60 * 24 * 14 // две недели

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] JWT_SECRET не задан — задайте его в .env перед выкладкой на прод')
}

export function verifyUser(login, password) {
  const user = db.prepare('SELECT * FROM users WHERE login = ?').get(String(login ?? '').trim())
  if (!user) return null
  if (!bcrypt.compareSync(String(password ?? ''), user.password_hash)) return null
  return { id: user.id, login: user.login, name: user.name }
}

export function issueSession(res, user) {
  const token = jwt.sign({ uid: user.id, login: user.login }, SECRET, { expiresIn: '14d' })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: process.env.COOKIE_SECURE === '1',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' })
}

/** Кладёт req.user, если куки валидна. Не отвергает запрос. */
export function readSession(req, _res, next) {
  const token = req.cookies?.[COOKIE]
  if (token) {
    try {
      const { uid } = jwt.verify(token, SECRET)
      const user = db.prepare('SELECT id, login, name FROM users WHERE id = ?').get(uid)
      if (user) req.user = user
    } catch {
      /* просроченная или подделанная кука — просто считаем, что не залогинен */
    }
  }
  next()
}

/** Пропускает дальше только авторизованных. */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Нужна авторизация' })
  next()
}

export function changePassword(userId, currentPassword, newPassword) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return { ok: false, error: 'Пользователь не найден' }
  if (!bcrypt.compareSync(String(currentPassword ?? ''), user.password_hash)) {
    return { ok: false, error: 'Текущий пароль неверен' }
  }
  if (String(newPassword ?? '').length < 8) {
    return { ok: false, error: 'Новый пароль короче 8 символов' }
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(String(newPassword), 10),
    userId,
  )
  return { ok: true }
}
