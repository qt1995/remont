import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { api, type MediaItem } from '@/lib/api'
import { Button, Modal, Spinner, useToast } from '@/components/ui'

/** Картинка может быть как из загрузок, так и просто путём из папки сайта. */
export function ImagePicker({
  value,
  onChange,
  label = 'Изображение',
}: {
  value: string
  onChange: (v: string) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-navy-700">{label}</span>
      <div className="flex items-start gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-sand">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus aria-hidden className="size-6 text-subtle" />
          )}
        </div>
        <div className="flex-1">
          <input
            className="field"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/файл.jpg или /portfolio/work-1.svg"
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" onClick={() => setOpen(true)}>
              <Upload aria-hidden className="size-4" />
              Выбрать или загрузить
            </Button>
            {value && (
              <Button type="button" variant="ghost" onClick={() => onChange('')}>
                Очистить
              </Button>
            )}
          </div>
        </div>
      </div>

      <MediaLibrary
        open={open}
        onClose={() => setOpen(false)}
        onPick={(url) => {
          onChange(url)
          setOpen(false)
        }}
      />
    </div>
  )
}

export function MediaLibrary({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick?: (url: string) => void
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { notify } = useToast()

  const load = () =>
    api
      .get<MediaItem[]>('/admin/media')
      .then(setItems)
      .catch((e) => notify(e.message, 'bad'))

  useEffect(() => {
    if (open && !items) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    setBusy(true)
    try {
      await api.post('/admin/media', fd)
      await load()
      notify('Загружено: ' + files.length + ' файл(ов)')
    } catch (e) {
      notify((e as Error).message, 'bad')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = async (m: MediaItem) => {
    try {
      await api.del('/admin/media/' + m.id)
      setItems((v) => (v ?? []).filter((x) => x.id !== m.id))
    } catch (e) {
      notify((e as Error).message, 'bad')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Файлы" wide>
      <div className="mb-4 flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => upload(e.target.files)}
          className="hidden"
          id="media-upload"
        />
        <Button variant="primary" loading={busy} onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden className="size-4" />
          Загрузить файлы
        </Button>
        <p className="text-[13px] text-subtle">jpg, png, webp, avif, svg — до 8 МБ</p>
      </div>

      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-subtle">Пока ничего не загружено.</p>
      ) : (
        <ul className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="group relative overflow-hidden rounded-lg border border-line">
              <button
                type="button"
                onClick={() => onPick?.(m.url)}
                className="block w-full cursor-pointer"
                title={m.original_name}
              >
                <img src={m.url} alt="" className="aspect-[4/3] w-full bg-sand object-cover" />
                <span className="block truncate px-2 py-1.5 text-left text-[12px] text-subtle">
                  {m.original_name || m.filename}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(m)}
                aria-label="Удалить файл"
                className="absolute top-1.5 right-1.5 hidden cursor-pointer rounded-md bg-white/90 p-1.5 text-bad shadow-sm group-hover:block"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
