import { useState } from 'react'
import { PageHeader } from '@/components/ui'
import { MediaLibrary } from '@/components/ImagePicker'

/** Отдельный раздел — та же библиотека файлов, только открытая сразу. */
export function MediaPage() {
  const [open, setOpen] = useState(true)

  return (
    <>
      <PageHeader
        title="Файлы"
        description="Фотографии объектов, кадры для слайдера этапов и обложки видеоотзывов. Ссылку на файл можно вставить в любое поле «Изображение»."
      />
      <MediaLibrary open={open} onClose={() => setOpen(false)} />
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2.5 font-display text-sm font-medium hover:bg-sand"
        >
          Открыть библиотеку файлов
        </button>
      )}
    </>
  )
}
