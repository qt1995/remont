import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Button, Field } from '@/components/ui'
import { useAuth } from '@/lib/auth'

export function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(form.login, form.password)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-navy p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-pop">
        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold">Вход в админку</h1>
          <p className="mt-1 text-sm text-subtle">Управление сайтом и заявками</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Логин">
            <input
              className="field"
              autoFocus
              autoComplete="username"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
            />
          </Field>

          <Field label="Пароль" error={error}>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>

          <Button type="submit" variant="dark" loading={busy} className="mt-1 w-full">
            <LogIn aria-hidden className="size-4" />
            Войти
          </Button>
        </form>
      </div>
    </div>
  )
}
