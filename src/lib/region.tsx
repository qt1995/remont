import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultRegion, regions, type RegionId } from '@/config/site'
import { RegionContext } from '@/lib/regionContext'

export { useRegion, useRegionPrice } from '@/lib/regionContext'

const STORAGE_KEY = 'remont:region'

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [regionId, setRegionId] = useState<RegionId>(() => {
    if (typeof localStorage === 'undefined') return defaultRegion
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && saved in regions ? (saved as RegionId) : defaultRegion
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, regionId)
  }, [regionId])

  const setRegion = useCallback((id: RegionId) => setRegionId(id), [])

  const value = useMemo(
    () => ({ region: regions[regionId], regionId, setRegion }),
    [regionId, setRegion],
  )

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}
