import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, type Row } from '@/lib/api'
import { Badge, Button, Card, Empty, Field, Modal, Spinner, useConfirm, useToast } from '@/components/ui'
import { ImagePicker } from '@/components/ImagePicker'
import { RowTable, type ColumnDef } from '@/components/RowTable'

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
  columns: ColumnDef[]
  /** Переключатели «жирный / курсив» для строки */
  formatting?: boolean
  /** Строку можно скрыть с сайта, оставив в PDF */
  hideable?: boolean
  /** Имя поля с комментарием под строкой */
  commentField?: string
  hint?: string
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
  const [original, setOriginal] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const { notify } = useToast()
  const { confirm, dialog } = useConfirm()
  const { confirm: confirmClose, dialog: closeDialog } = useConfirm()

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

  const dirty = !!editing && JSON.stringify(editing) !== original

  // Уйти из формы с несохранёнными правками легко, а заметить это — нет.
  // Поэтому спрашиваем и при закрытии окна, и при уходе со страницы.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const closeEditor = async () => {
    const ok =
      !dirty ||
      (await confirmClose(
        'Вы что-то поменяли, но не нажали «Сохранить». Закрыть и потерять правки?',
        {
          title: 'Правки не сохранены',
          confirmLabel: 'Закрыть без сохранения',
          cancelLabel: 'Вернуться к правкам',
        },
      ))
    if (!ok) return
    setEditing(null)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      if (isNew) await api.post(endpoint, editing)
      else await api.put(endpoint + '/' + editing.id, editing)
      setOriginal(JSON.stringify(editing))
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
              const row = { ...emptyRow }
              setEditing(row)
              setOriginal(JSON.stringify(row))
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
                    const copy = { ...row }
                    setEditing(copy)
                    setOriginal(JSON.stringify(copy))
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
        onClose={closeEditor}
        title={(isNew ? addLabel : 'Редактирование') + (dirty ? ' • не сохранено' : '')}
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
              <fieldset className="mt-6 border-t border-line pt-5">
                <legend className="sr-only">{child.label}</legend>
                <div className="mb-3">
                  <h3 className="font-display text-[15px] font-semibold">{child.label}</h3>
                  {child.hint && <p className="mt-1 text-[13px] text-subtle">{child.hint}</p>}
                </div>
                <RowTable
                  columns={child.columns}
                  rows={(editing.items as Row[]) ?? []}
                  onChange={(items) => setEditing({ ...editing, items })}
                  addLabel={child.addLabel}
                  formatting={child.formatting}
                  hideable={child.hideable}
                  commentField={child.commentField}
                />
              </fieldset>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
              <Button type="button" onClick={closeEditor}>
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
      {closeDialog}
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
