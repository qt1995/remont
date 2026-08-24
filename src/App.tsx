import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileCta } from '@/components/layout/MobileCta'
import { Hero } from '@/components/sections/Hero'
import { StageSliderSection } from '@/components/sections/StageSliderSection'
import { Tariffs } from '@/components/sections/Tariffs'
import { CalculatorSection } from '@/components/sections/CalculatorSection'
import { PriceList } from '@/components/sections/PriceList'
import { Portfolio } from '@/components/sections/Portfolio'
import { Pains } from '@/components/sections/Pains'
import { Process } from '@/components/sections/Process'
import { Guarantees } from '@/components/sections/Guarantees'
import { Reviews } from '@/components/sections/Reviews'
import { Faq } from '@/components/sections/Faq'
import { Contacts } from '@/components/sections/Contacts'
import { Partners } from '@/components/sections/Partners'
import { RegionProvider } from '@/lib/region'
import { LeadModalProvider } from '@/lib/leadModal'
import { ContentProvider, useContent } from '@/lib/content'
import { initMetrika, track } from '@/lib/analytics'
import { useScrollRestore } from '@/lib/useScrollRestore'

/** Счётчик Метрики и просмотр страницы — после того, как настройки пришли с сервера. */
function Analytics() {
  const { settings, tariffs } = useContent()

  // Контент пришёл — страница доросла до своей высоты, можно вернуть прокрутку
  useScrollRestore(tariffs.length > 0)

  useEffect(() => {
    if (settings.yandexMetrikaId) initMetrika(settings.yandexMetrikaId)
  }, [settings.yandexMetrikaId])

  useEffect(() => {
    track('pageview')
  }, [])

  return null
}

export default function App() {
  return (
    <ContentProvider>
      <RegionProvider>
        <LeadModalProvider>
          <Analytics />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-200 focus:rounded-xl focus:bg-navy focus:px-5 focus:py-3 focus:text-white"
          >
            Перейти к содержимому
          </a>

          <Header />

          <main id="main" className="pb-20 sm:pb-0">
            <Hero />
            <StageSliderSection />
            <Tariffs />
            <CalculatorSection />
            <PriceList />
            <Portfolio />
            <Pains />
            <Process />
            <Guarantees />
            <Partners />
            <Reviews />
            <Faq />
            <Contacts />
          </main>

          <Footer />
          <MobileCta />
        </LeadModalProvider>
      </RegionProvider>
    </ContentProvider>
  )
}
