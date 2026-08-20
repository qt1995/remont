import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, type Row } from '@/lib/api'
import { Badge, Button, Card, Empty, Field, Modal, Spinner, useConfirm, useToast } from '@/components/ui'
import { ImagePicker } from '@/components/ImagePicker'

export type FieldDef = {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'image'
  options?: { value: string; label: string }[]
  hint?: string
  placeholder?: string
  /** Занимать всю ширину формы */
  full?: boolean
  required?: boolean
}

export type ChildDef = {
  /** Ключ массива в объекте (сервер всегда отдаёт items) */
  label: string
  addLabel: string
  fields: FieldDef[]
}

type Props = {
  endpoint: string
  fields: FieldDef[]
  title: (row: Row) => ReactNode
  subtitle?: (row: Row) => ReactNode
  /** Значения по умолчанию для новой записи */
  blank?: Record<string, unknown>
  child?: ChildDef
  /** Для таблиц с текстовым id (тарифы, группы прайса) */
  textId?: boolean
  addLabel?: string
  emptyHint?: string
}

const asString = (v: unknown) => (v === null || v === undefined ? '' : String(v))

export function CollectionEditor({
  endpoint,
  fields,
  title,
  subtitle,
  blank = {},
  child,
  textId = false,
  addLabel = 'Добавить',
  emptyHint,
}: Props) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const { notify } = useToast()
  const { confirm, dialog } = useConfirm()

  const load = useCallback(() => {
    api
      .get<Row[]>(endpoint)
      .then(setRows)
      .catch((e) => notify(e.message, 'bad'))
  }, [endpoint, notify])

  useEffect(load, [load])

  const emptyRow = useMemo(() => {
    const r: Record<string, unknown> = { ...blank }
    for (const f of fields) if (!(f.name in r)) r[f.name] = f.type === 'bool' ? 1 : f.type === 'number' ? 0 : ''
    if (child) r.items = []
    return r as Row
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, child])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      if (isNew) await api.post(endpoint, editing)
      else await api.put(endpoint + '/' + editing.id, editing)
      setEditing(null)
      load()
      notify('Сохранено')
    } catch (e) {
      notify((e as Error).message, 'bad')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: Row) => {
    if (!(await confirm('Удалить «' + String(title(row)) + '»? Действие необратимо.'))) return
    try {
      await api.del(endpoint + '/' + row.id)
      setRows((v) => (v ?? []).filter((r) => r.id !== row.id))
      notify('Удалено')
    } catch (e) {
      notify((e as Error).message, 'bad')
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    if (!rows) return
    const next = [...rows]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
    try {
      await api.post(endpoint + '/reorder', { ids: next.map((r) => r.id) })
    } catch (e) {
      notify((e as Error).message, 'bad')
      load()
    }
  }

  const toggleActive = async (row: Row) => {
    const value = row.active ? 0 : 1
    setRows((v) => (v ?? []).map((r) => (r.id === row.id ? { ...r, active: value } : r)))
    try {
      await api.put(endpoint + '/' + row.id, { active: value })
    } catch (e) {
      notify((e as Error).message, 'bad')
      load()
    }
  }

  if (!rows) return <Spinner />

  const hasActive = fields.some((f) => f.name === 'active')

  return (
    <>
      <Card
        padded={false}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing({ ...emptyRow })
              setIsNew(true)
            }}
          >
            <Plus aria-hidden className="size-4" />
            {addLabel}
          </Button>
        }
        title={<span className="tnum text-subtle">{rows.length} записей</span>}
      >
        {rows.length === 0 ? (
          <div className="p-5">
            <Empty title="Пока пусто" hint={emptyHint} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row, i) => (
              <li key={String(row.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-sand/60">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Выше"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="cursor-pointer rounded p-0.5 text-subtle hover:text-navy disabled:opacity-25"
                  >
                    <ChevronUp aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ниже"
                    disabled={i === rows.length - 1}
                    onClick={() => move(i, 1)}
                    className="cursor-pointer rounded p-0.5 text-subtle hover:text-navy disabled:opacity-25"
                  >
                    <ChevronDown aria-hidden className="size-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-medium">{title(row)}</p>
                  {subtitle && <p className="truncate text-[13px] text-subtle">{subtitle(row)}</p>}
                </div>

                {hasActive && (
                  <button
                    type="button"
                    onClick={() => toggleActive(row)}
                    className="cursor-pointer"
                    title={row.active ? 'Показывается на сайте' : 'Скрыто'}
                  >
                    <Badge tone={row.active ? 'ok' : 'neutral'}>
                      {row.active ? 'на сайте' : 'скрыто'}
                    </Badge>
                  </button>
                )}

                <Button
                  onClick={() => {
                    setEditing({ ...row })
                    setIsNew(false)
                  }}
                >
                  <Pencil aria-hidden className="size-4" />
                  Править
                </Button>
                <Button variant="danger" aria-label="Удалить" onClick={() => remove(row)}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? addLabel : 'Редактирование'}
        wide={!!child}
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            {isNew && textId && (
              <Field
                label="Идентификатор"
                hint="Латиницей, без пробелов — например new-turnkey. Менять потом нельзя."
                className="mb-4"
              >
                <input
                  className="field"
                  required
                  value={asString(editing.id)}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <FieldInput
                  key={f.name}
                  def={f}
                  value={editing[f.name]}
                  onChange={(v) => setEditing({ ...editing, [f.name]: v })}
                />
              ))}
            </div>

            {child && (
              <ChildList
                def={child}
                rows={(editing.items as Row[]) ?? []}
                onChange={(items) => setEditing({ ...editing, items })}
              />
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
              <Button type="button" onClick={() => setEditing(null)}>
                Отмена
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                Сохранить
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {dialog}
    </>
  )
}

export function FieldInput({
  def,
  value,
  onChange,
}: {
  def: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  const cls = def.full || def.type === 'textarea' || def.type === 'image' ? 'sm:col-span-2' : ''

  if (def.type === 'image') {
    return (
      <div className={cls}>
        <ImagePicker label={def.label} value={asString(value)} onChange={onChange} />
        {def.hint && <p className="mt-1 text-[12px] text-subtle">{def.hint}</p>}
      </div>
    )
  }

  if (def.type === 'bool') {
    return (
      <Field label={def.label} hint={def.hint} className={cls}>
        <select
          className="field"
          value={value ? '1' : '0'}
          onChange={(e) => onChange(e.target.value === '1' ? 1 : 0)}
        >
          <option value="1">Да</option>
          <option value="0">Нет</option>
        </select>
      </Field>
    )
  }

  if (def.type === 'select') {
    return (
      <Field label={def.label} hint={def.hint} className={cls}>
        <select className="field" value={asString(value)} onChange={(e) => onChange(e.target.value)}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    )
  }

  if (def.type === 'textarea') {
    return (
      <Field label={def.label} hint={def.hint} className={cls}>
        <textarea
          className="field"
          rows={4}
          required={def.required}
          placeholder={def.placeholder}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    )
  }

  return (
    <Field label={def.label} hint={def.hint} className={cls}>
      <input
        className={'field' + (def.type === 'number' ? ' tnum' : '')}
        type={def.type === 'number' ? 'number' : 'text'}
        required={def.required}
        placeholder={def.placeholder}
        value={asString(value)}
        onChange={(e) => onChange(def.type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </Field>
  )
}

function ChildList({
  def,
  rows,
  onChange,
}: {
  def: ChildDef
  rows: Row[]
  onChange: (rows: Row[]) => void
}) {
  const update = (i: number, patch: Record<string, unknown>) =>
    onChange(rows.map((r, j) => (i === j ? { ...r, ...patch } : r)))

  const blank = Object.fromEntries(def.fields.map((f) => [f.name, f.type === 'number' ? 0 : '']))

  return (
    <fieldset className="mt-6 border-t border-line pt-5">
      <legend className="sr-only">{def.label}</legend>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-semibold">{def.label}</h3>
        <Button type="button" onClick={() => onChange([...rows, { id: 'new-' + rows.length, ...blank }])}>
          <Plus aria-hidden className="size-4" />
          {def.addLabel}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-subtle">
          Пока ни одного пункта.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg border border-line bg-sand/50 p-2.5">
              <div className="flex flex-col pt-1.5">
                <button
                  type="button"
                  aria-label="Выше"
                  disabled={i === 0}
                  onClick={() => {
                    const n = [...rows]
                    ;[n[i - 1], n[i]] = [n[i], n[i - 1]]
                    onChange(n)
                  }}
                  className="cursor-pointer rounded p-0.5 text-subtle hover:text-navy disabled:opacity-25"
                >
                  <ChevronUp aria-hidden className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Ниже"
                  disabled={i === rows.length - 1}
                  onClick={() => {
                    const n = [...rows]
                    ;[n[i], n[i + 1]] = [n[i + 1], n[i]]
                    onChange(n)
                  }}
                  className="cursor-pointer rounded p-0.5 text-subtle hover:text-navy disabled:opacity-25"
                >
                  <ChevronDown aria-hidden className="size-3.5" />
                </button>
              </div>

              <div className="grid flex-1 gap-2 sm:grid-cols-[2fr_repeat(auto-fit,minmax(90px,1fr))]">
                {def.fields.map((f) => (
                  <FieldInput
                    key={f.name}
                    def={{ ...f, label: i === 0 ? f.label : '' }}
                    value={row[f.name]}
                    onChange={(v) => update(i, { [f.name]: v })}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label="Убрать пункт"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                className="mt-1 cursor-pointer rounded p-1.5 text-subtle hover:bg-bad-bg hover:text-bad"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
