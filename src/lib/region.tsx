import { useCallback, useEffect, useMemo, useState } from 'react'
import { RegionContext, type Region } from '@/lib/regionContext'
import { useContent } from '@/lib/content'

export { useRegion, useRegionPrice } from '@/lib/regionContext'
export type { Region } from '@/lib/regionContext'

const STORAGE_KEY = 'remont:region'

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const { regions } = useContent()
  const [regionId, setRegionId] = useState<string>(() => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(STORAGE_KEY) ?? ''
  })

  // Список городов приходит из админки: если сохранённый город убрали, берём первый.
  const region: Region = useMemo(
    () => regions.find((r) => r.id === regionId) ?? regions[0],
    [regions, regionId],
  )

  useEffect(() => {
    if (region) localStorage.setItem(STORAGE_KEY, region.id)
  }, [region])

  const setRegion = useCallback((id: string) => setRegionId(id), [])

  const value = useMemo(
    () => ({ region, regionId: region?.id ?? '', regions, setRegion }),
    [region, regions, setRegion],
  )

  if (!region) return null

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}
