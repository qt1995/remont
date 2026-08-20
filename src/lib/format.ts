const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export const formatMoney = (value: number) => rub.format(Math.round(value))
export const formatNumber = (value: number) => num.format(Math.round(value))

/** 5 дней / 1 день / 22 дня */
export const plural = (n: number, forms: [string, string, string]) => {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

export const formatDays = (n: number) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`

/** Округление вверх до «красивой» суммы, чтобы вилка не выглядела как машинный вывод. */
export const roundTo = (value: number, step: number) => Math.round(value / step) * step
