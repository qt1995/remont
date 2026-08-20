/**
 * Знак «ПРО Комфорт».
 *
 * Буква П — это и первая буква названия, и дверной проём: входишь в квартиру,
 * а из проёма падает тёплый свет. Отсюда золотой луч в проходе и линия пола.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden focusable="false">
      <rect x="2.5" y="2.5" width="35" height="35" rx="9.5" fill="currentColor" />

      {/* свет из проёма — расширяется книзу */}
      <path d="M16 15 H24 L25.4 27.5 H14.6 Z" fill="#e2b458" />

      {/* сама «П» */}
      <path d="M9 10 H31 V27.5 H26 V15 H14 V27.5 H9 Z" fill="#fff" />

      {/* пол */}
      <rect x="9" y="28.7" width="22" height="1.6" rx="0.8" fill="#fff" opacity="0.5" />
    </svg>
  )
}

/**
 * Название с раздельным начертанием: первое слово плотнее остальных.
 * Работает с любым брендом — просто делит по первому пробелу.
 */
export function Wordmark({ brand, className = '' }: { brand: string; className?: string }) {
  const [first, ...rest] = brand.trim().split(' ')

  return (
    <span className={'font-display tracking-tight whitespace-nowrap ' + className}>
      <span className="font-bold">{first}</span>
      {rest.length > 0 && <span className="font-medium"> {rest.join(' ')}</span>}
    </span>
  )
}
