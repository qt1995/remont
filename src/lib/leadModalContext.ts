import { createContext, useContext } from 'react'

export type LeadModalArgs = {
  title?: string
  lead?: string
  source: string
  payload?: Record<string, unknown>
}

export type LeadModalCtx = { openLead: (args: LeadModalArgs) => void }

/**
 * Контекст живёт в отдельном файле без компонентов: иначе Fast Refresh
 * пересоздаёт объект контекста при правке провайдера, и хук падает.
 */
export const LeadModalContext = createContext<LeadModalCtx | null>(null)

export function useLeadModal() {
  const ctx = useContext(LeadModalContext)
  if (!ctx) throw new Error('useLeadModal должен вызываться внутри LeadModalProvider')
  return ctx
}
