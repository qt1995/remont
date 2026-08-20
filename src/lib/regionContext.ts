import { createContext, useCallback, useContext } from 'react'
import type { Region, RegionId } from '@/config/site'

export type RegionCtx = { region: Region; regionId: RegionId; setRegion: (id: RegionId) => void }

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
