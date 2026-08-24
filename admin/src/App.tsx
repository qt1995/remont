import { useState } from 'react'
import {
  ChartNoAxesCombined,
  ExternalLink,
  FileText,
  FolderOpen,
  Images,
  Inbox,
  Layers,
  Scale,
  Dices,
  LogOut,
  Menu,
  Calculator,
  Receipt,
  Settings as SettingsIcon,
  X,
} from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ToastProvider, Button, Spinner } from '@/components/ui'
import { useHashRoute } from '@/lib/useHashRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Leads } from '@/pages/Leads'
import {
  CalculatorPage,
  ContentPage,
  PricePage,
  TariffsPage,
  WorksPage,
} from '@/pages/collections'
import { SettingsPage } from '@/pages/Settings'
import { MediaPage } from '@/pages/Media'
import { LegalPage } from '@/pages/Legal'
import { CasinoPage } from '@/pages/Casino'

const NAV = [
  { id: 'dashboard', label: 'Сводка', icon: ChartNoAxesCombined },
  { id: 'leads', label: 'Заявки', icon: Inbox },
  { id: 'tariffs', label: 'Тарифы', icon: Layers },
  { id: 'price', label: 'Прайс', icon: Receipt },
  { id: 'calc', label: 'Калькулятор', icon: Calculator },
  { id: 'works', label: 'Работы', icon: Images },
  { id: 'content', label: 'Тексты', icon: FileText },
  { id: 'media', label: 'Файлы', icon: FolderOpen },
  { id: 'legal', label: 'Документы', icon: Scale },
  { id: 'settings', label: 'Настройки', icon: SettingsIcon },
  { id: 'casino', label: 'Казик', icon: Dices },
]

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://qt1995.github.io/remont/'

function Shell() {
  const { user, loading, logout } = useAuth()
  const { route, navigate } = useHashRoute()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner label="Проверяем сессию…" />
      </div>
    )
  }

  if (!user) return <Login />

  const go = (id: string) => {
    navigate(id)
    setMenuOpen(false)
  }

  const nav = (
    <nav aria-label="Разделы админки" className="flex flex-1 flex-col gap-0.5">
      {NAV.map((n) => {
        const active = route === n.id
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => go(n.id)}
            aria-current={active ? 'page' : undefined}
            className={
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-left font-display text-[14px] font-medium transition-colors ' +
              (active ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/6 hover:text-white')
            }
          >
            <n.icon aria-hidden className="size-[18px] shrink-0" />
            {n.label}
          </button>
        )
      })}
    </nav>
  )

  const footer = (
    <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
      <a
        href={SITE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 font-display text-[14px] font-medium text-white/65 hover:bg-white/6 hover:text-white"
      >
        <ExternalLink aria-hidden className="size-[18px] shrink-0" />
        Открыть сайт
      </a>
      <button
        type="button"
        onClick={logout}
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 font-display text-[14px] font-medium text-white/65 hover:bg-white/6 hover:text-white"
      >
        <LogOut aria-hidden className="size-[18px] shrink-0" />
        Выйти
      </button>
    </div>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Боковое меню на больших экранах */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-4 bg-navy p-4 lg:flex">
        <div className="px-3 py-2">
          <p className="font-display text-[15px] font-bold text-white">Админка</p>
          <p className="text-[12px] text-white/50">ремонт под ключ</p>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Шапка на мобильных */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
          className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-sand"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <p className="font-display font-semibold">
          {NAV.find((n) => n.id === route)?.label ?? 'Админка'}
        </p>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="flex h-dvh w-[min(84vw,280px)] flex-col gap-4 bg-navy p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="font-display text-[15px] font-bold text-white">Админка</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
                className="grid size-9 cursor-pointer place-items-center rounded-lg text-white/70 hover:bg-white/10"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        {route === 'dashboard' && <Dashboard />}
        {route === 'leads' && <Leads />}
        {route === 'tariffs' && <TariffsPage />}
        {route === 'price' && <PricePage />}
        {route === 'calc' && <CalculatorPage />}
        {route === 'works' && <WorksPage />}
        {route === 'content' && <ContentPage />}
        {route === 'media' && <MediaPage />}
        {route === 'legal' && <LegalPage />}
        {route === 'settings' && <SettingsPage />}
        {route === 'casino' && <CasinoPage />}
        {!NAV.some((n) => n.id === route) && (
          <div className="py-20 text-center">
            <p className="font-display text-lg font-semibold">Раздел не найден</p>
            <Button className="mt-4" onClick={() => go('dashboard')}>
              На сводку
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ToastProvider>
  )
}
