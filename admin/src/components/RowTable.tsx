import { useId, useState, type ReactNode } from 'react'
import { Bold, GripVertical, Italic, Plus, Trash2 } from 'lucide-react'
import type { Row } from '@/lib/api'

export type ColumnDef = {
  name: string
  label: string
  type?: 'text' | 'number' | 'select' | 'unit'
  options?: { value: string; label: string }[]
  /** Подсказки для поля с ручным вводом (единицы измерения) */
  suggestions?: string[]
  width?: string
  placeholder?: string
}

type Props = {
  columns: ColumnDef[]
  rows: Row[]
  onChange: (rows: Row[]) => void
  addLabel: string
  /** Показывать переключатели «жирный / курсив» (колонка emphasis) */
  formatting?: boolean
  /** Показывать переключатель видимости строки на сайте (колонка active) */
  hideable?: boolean
  /** Дополнительное поле под строкой — комментарий */
  commentField?: string
  emptyHint?: ReactNode
}

const blankRow = (columns: ColumnDef[], formatting: boolean, hideable: boolean, comment?: string) => {
  const r: Row = { id: 'new-' + Math.random().toString(36).slice(2) }
  for (const c of columns) {
    // У выпадающего списка пустое значение недопустимо — база его отвергнет,
    // поэтому новая строка сразу получает первый вариант.
    r[c.name] = c.type === 'select' ? (c.options?.[0]?.value ?? '') : c.type === 'number' ? 0 : ''
  }
  if (formatting) r.emphasis = ''
  if (hideable) r.active = 1
  if (comment) r[comment] = ''
  return r
}

/**
 * Табличный редактор строк: перетаскивание, вставка в нужное место,
 * скрытие строки с сайта и простое оформление текста.
 *
 * Сделан таблицей, а не карточками: так строки читаются подряд, как в Excel,
 * и видно, что цены выстроены в одну колонку.
 */
export function RowTable({
  columns,
  rows,
  onChange,
  addLabel,
  formatting = false,
  hideable = false,
  commentField,
  emptyHint,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  // Подсказки для единиц — один список на таблицу, иначе получаются дубли id
  const listId = useId()
  const suggestions = columns.find((c) => c.type === 'unit')?.suggestions ?? []

  const update = (i: number, patch: Record<string, unknown>) =>
    onChange(rows.map((r, j) => (i === j ? { ...r, ...patch } : r)))

  const insertAt = (i: number) => {
    const next = [...rows]
    next.splice(i, 0, blankRow(columns, formatting, hideable, commentField))
    onChange(next)
  }

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to > rows.length) return
    const next = [...rows]
    const [row] = next.splice(from, 1)
    next.splice(from < to ? to - 1 : to, 0, row)
    onChange(next)
  }

  const toggleEmphasis = (i: number, flag: 'bold' | 'italic') => {
    const current = String(rows[i].emphasis ?? '')
    const has = current.includes(flag)
    const parts = current.split(' ').filter(Boolean).filter((p) => p !== flag)
    if (!has) parts.push(flag)
    update(i, { emphasis: parts.join(' ') })
  }

  /** Тонкая зона между строками: при наведении показывает «плюс». */
  const InsertZone = ({ index }: { index: number }) => (
    <div
      className="group/insert relative h-2"
      onDragOver={(e) => {
        e.preventDefault()
        setOverIndex(index)
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (dragIndex !== null) move(dragIndex, index)
        setDragIndex(null)
        setOverIndex(null)
      }}
    >
      <span
        aria-hidden
        className={
          'absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-colors ' +
          (overIndex === index && dragIndex !== null ? 'bg-gold' : 'bg-transparent')
        }
      />
      <button
        type="button"
        onClick={() => insertAt(index)}
        aria-label={'Вставить строку в позицию ' + (index + 1)}
        className="absolute top-1/2 left-1/2 hidden size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-white text-subtle shadow-sm hover:border-gold hover:text-gold group-hover/insert:grid"
      >
        <Plus aria-hidden className="size-3.5" />
      </button>
    </div>
  )

  return (
    <div>
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      )}

      {/* Заголовки колонок */}
      <div
        className="mb-1 grid gap-2 px-9 text-[11px] tracking-wide text-subtle uppercase"
        style={{ gridTemplateColumns: columns.map((c) => c.width ?? '1fr').join(' ') }}
      >
        {columns.map((c) => (
          <span key={c.name}>{c.label}</span>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-white">
        <InsertZone index={0} />

        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-subtle">
            {emptyHint ?? 'Пока ни одной строки. Наведите на полоску выше и нажмите «плюс».'}
          </p>
        )}

        {rows.map((row, i) => {
          const hidden = hideable && !row.active
          const emphasis = String(row.emphasis ?? '')

          return (
            <div key={String(row.id ?? i)}>
              <div
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className={
                  'flex items-start gap-2 px-2 py-1.5 transition-colors ' +
                  (dragIndex === i ? 'opacity-40 ' : '') +
                  (hidden ? 'bg-paper' : '')
                }
              >
                <span
                  aria-hidden
                  title="Перетащите, чтобы поменять порядок"
                  className="mt-2 cursor-grab text-subtle active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: columns.map((c) => c.width ?? '1fr').join(' ') }}
                  >
                    {columns.map((c) => (
                      <Cell
                        key={c.name}
                        def={c}
                        value={row[c.name]}
                        emphasis={emphasis}
                        dim={hidden}
                        listId={listId}
                        onChange={(v) => update(i, { [c.name]: v })}
                      />
                    ))}
                  </div>

                  {commentField && (
                    <input
                      className="field mt-1.5 text-[13px]"
                      placeholder="Комментарий к работе — покажем под названием"
                      value={String(row[commentField] ?? '')}
                      onChange={(e) => update(i, { [commentField]: e.target.value })}
                    />
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-0.5 pt-1">
                  {formatting && (
                    <>
                      <IconToggle
                        active={emphasis.includes('bold')}
                        onClick={() => toggleEmphasis(i, 'bold')}
                        label="Жирный"
                      >
                        <Bold className="size-3.5" />
                      </IconToggle>
                      <IconToggle
                        active={emphasis.includes('italic')}
                        onClick={() => toggleEmphasis(i, 'italic')}
                        label="Курсив"
                      >
                        <Italic className="size-3.5" />
                      </IconToggle>
                    </>
                  )}

                  {hideable && (
                    <button
                      type="button"
                      onClick={() => update(i, { active: hidden ? 1 : 0 })}
                      title={
                        hidden
                          ? 'Скрыта с сайта, но попадёт в PDF — нажмите, чтобы показать'
                          : 'Показывается на сайте — нажмите, чтобы скрыть'
                      }
                      className={
                        'ml-1 cursor-pointer rounded-md px-2 py-1 font-display text-[11px] font-medium transition-colors ' +
                        (hidden ? 'bg-sand text-subtle' : 'bg-ok-bg text-ok')
                      }
                    >
                      {hidden ? 'в PDF' : 'на сайте'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    aria-label="Удалить строку"
                    className="ml-1 cursor-pointer rounded-md p-1.5 text-subtle hover:bg-bad-bg hover:text-bad"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <InsertZone index={i + 1} />
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => insertAt(rows.length)}
        className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-medium hover:bg-sand"
      >
        <Plus aria-hidden className="size-4" />
        {addLabel}
      </button>
    </div>
  )
}

function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={
        'grid size-7 cursor-pointer place-items-center rounded-md transition-colors ' +
        (active ? 'bg-navy text-white' : 'text-subtle hover:bg-sand hover:text-navy')
      }
    >
      {children}
    </button>
  )
}

/** Единицы измерения: список подсказок плюс возможность вписать своё. */
function Cell({
  def,
  value,
  emphasis,
  dim,
  listId,
  onChange,
}: {
  def: ColumnDef
  value: unknown
  emphasis: string
  dim: boolean
  listId: string
  onChange: (v: unknown) => void
}) {
  const text = value === null || value === undefined ? '' : String(value)
  const style =
    (emphasis.includes('bold') ? 'font-semibold ' : '') + (emphasis.includes('italic') ? 'italic ' : '')

  if (def.type === 'select') {
    return (
      <select className="field" value={text} onChange={(e) => onChange(e.target.value)}>
        {def.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }

  if (def.type === 'unit') {
    return (
      <input
        className="field"
        list={listId}
        value={text}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <input
      className={'field ' + style + (dim ? 'text-subtle' : '')}
      type={def.type === 'number' ? 'number' : 'text'}
      value={text}
      placeholder={def.placeholder}
      onChange={(e) => onChange(def.type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  )
}

export const UNIT_SUGGESTIONS = [
  'м²',
  'пог. м',
  'шт',
  'точка',
  'мешок',
  'кг',
  'тонна',
  'м³',
  'комплект',
  'услуга',
  'входит в стоимость',
]
