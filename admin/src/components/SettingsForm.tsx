import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api, type Settings } from '@/lib/api'
import { Button, Card, Field, Spinner, useToast } from '@/components/ui'

export type SettingField = {
  name: string
  label: string
  type?: 'text' | 'number' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  hint?: string
  placeholder?: string
  full?: boolean
}

/**
 * Кусок настроек, вынесенный на отдельную страницу.
 *
 * Настройки лежат одной таблицей ключ-значение, поэтому редактировать их
 * можно из любого раздела: сохраняются только перечисленные поля, остальные
 * сервер не трогает.
 */
export function SettingsForm({
  title,
  description,
  fields,
  children,
}: {
  title: string
  description?: string
  fields: SettingField[]
  children?: React.ReactNode
}) {
  const [values, setValues] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    api
      .get<Settings>('/admin/settings')
      .then(setValues)
      .catch((e) => notify(e.message, 'bad'))
  }, [notify])

  if (!values) return <Spinner />

  const set = (k: string, v: string) => setValues({ ...values, [k]: v })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Отправляем только свои поля — чтобы не затереть чужие настройки
      const patch = Object.fromEntries(fields.map((f) => [f.name, values[f.name] ?? '']))
      const next = await api.put<Settings>('/admin/settings', patch)
      setValues(next)
      notify('Сохранено')
    } catch (err) {
      notify((err as Error).message, 'bad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save}>
      <Card
        title={title}
        actions={
          <Button type="submit" variant="primary" loading={saving}>
            <Save aria-hidden className="size-4" />
            Сохранить
          </Button>
        }
      >
        {description && <p className="mb-5 max-w-2xl text-[13px] text-subtle">{description}</p>}

        {children}

        <div className="grid gap-4 sm:grid-cols-3">
          {fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              hint={f.hint}
              className={f.full || f.type === 'textarea' ? 'sm:col-span-3' : ''}
            >
              {f.type === 'textarea' ? (
                <textarea
                  className="field"
                  rows={2}
                  value={values[f.name] ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              ) : f.type === 'select' ? (
                <select
                  className="field"
                  value={values[f.name] ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={'field' + (f.type === 'number' ? ' tnum' : '')}
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={values[f.name] ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </Field>
          ))}
        </div>
      </Card>
    </form>
  )
}
