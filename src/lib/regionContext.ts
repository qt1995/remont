import { createContext, useCallback, useContext } from 'react'

export type Region = { id: string; name: string; nameIn: string; k: number }

export type RegionCtx = {
  region: Region
  regionId: string
  regions: Region[]
  setRegion: (id: string) => void
}

/** Контекст отдельно от провайдера — чтобы Fast Refresh не ломал хуки. */
export const RegionContext = createContext<RegionCtx | null>(null)

export function useRegion() {
  const ctx = useContext(RegionContext)
  if (!ctx) throw new Error('useRegion должен вызываться внутри RegionProvider')
  return ctx
}

/** Цена из базового прайса, пересчитанная под текущий регион. */
export function useRegionPrice() {
  const { region } = useRegion()
  return useCallback((base: number) => base * region.k, [region.k])
}
