import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'dark' | 'outline' | 'outlineDark' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-display font-medium cursor-pointer ' +
  'transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)] ' +
  'text-center leading-snug ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-gold text-white hover:bg-gold-600 shadow-[0_6px_20px_-8px_rgba(161,98,7,0.8)]',
  dark: 'bg-navy text-white hover:bg-navy-700',
  outline: 'border border-line bg-white text-navy hover:border-navy hover:bg-sand',
  outlineDark:
    'border border-white/30 bg-white/5 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/12',
  ghost: 'text-navy hover:bg-sand',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-base min-h-[52px]',
}



type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode }

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </a>
  )
}
