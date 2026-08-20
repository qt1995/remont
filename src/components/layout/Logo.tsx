/** Знак бренда — план квартиры: контур, перегородка и «сданная» комната. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden focusable="false">
      <rect x="2.5" y="2.5" width="35" height="35" rx="8" fill="currentColor" />
      <path
        d="M10 30V14.5L20 8l10 6.5V30"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="21.5" y="20" width="8.5" height="10" fill="#e2b458" />
      <path d="M10 30h20" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
