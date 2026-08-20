import { useCallback, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { LeadForm } from '@/components/forms/LeadForm'
import { LeadModalContext, type LeadModalArgs } from '@/lib/leadModalContext'

export { useLeadModal } from '@/lib/leadModalContext'

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const [args, setArgs] = useState<LeadModalArgs | null>(null)

  const openLead = useCallback((a: LeadModalArgs) => setArgs(a), [])
  const value = useMemo(() => ({ openLead }), [openLead])

  return (
    <LeadModalContext.Provider value={value}>
      {children}
      <Modal
        open={!!args}
        onClose={() => setArgs(null)}
        title={args?.title ?? 'Заявка на консультацию'}
      >
        <h2 className="pr-10 text-2xl font-semibold">
          {args?.title ?? 'Записаться на консультацию'}
        </h2>
        <p className="mt-2 mb-6 text-[15px] text-subtle">
          {args?.lead ??
            'Задаём несколько вопросов по телефону, называем вилку по деньгам и договариваемся о бесплатном замере.'}
        </p>
        {args && <LeadForm source={args.source} payload={args.payload} />}
      </Modal>
    </LeadModalContext.Provider>
  )
}
