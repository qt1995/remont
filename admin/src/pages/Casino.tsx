import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Coins, RotateCcw, Trophy, Zap } from 'lucide-react'
import { Button, Card, PageHeader } from '@/components/ui'

/* ─────────────────────────  Символы  ───────────────────────── */

type Symbol = {
  id: string
  name: string
  /** Чем реже выпадает, тем дороже стоит */
  weight: number
  payout: number
  draw: React.ReactNode
}

const brick = (
  <>
    <rect x="6" y="16" width="52" height="32" rx="3" fill="#b45309" />
    <rect x="6" y="16" width="52" height="10" rx="3" fill="#c2660b" />
    <path d="M6 26h52M6 37h52M20 16v10M40 26v11M28 37v11" stroke="#8a4206" strokeWidth="2" />
  </>
)

const tile = (
  <>
    <rect x="8" y="8" width="48" height="48" rx="4" fill="#e7edf2" />
    <path d="M32 8v48M8 32h48" stroke="#b7c6d3" strokeWidth="2.5" />
    <rect x="12" y="12" width="16" height="16" rx="2" fill="#cfdbe5" />
    <rect x="36" y="36" width="16" height="16" rx="2" fill="#cfdbe5" />
  </>
)

const laminate = (
  <>
    <rect x="6" y="14" width="52" height="36" rx="3" fill="#c9a578" />
    <path d="M6 26h52M6 38h52" stroke="#a07c4f" strokeWidth="2" />
    <path d="M24 14v12M40 26v12M18 38v12" stroke="#a07c4f" strokeWidth="2" />
  </>
)

const bag = (
  <>
    <path d="M18 20h28l4 32H14z" fill="#d8d2c4" />
    <path d="M18 20c2-6 6-8 14-8s12 2 14 8" fill="#c4bda9" />
    <rect x="22" y="30" width="20" height="9" rx="2" fill="#b91c1c" />
  </>
)

const roller = (
  <>
    <rect x="10" y="14" width="34" height="14" rx="4" fill="#e2b458" />
    <path d="M44 21h8v22" stroke="#64748b" strokeWidth="4" strokeLinecap="round" fill="none" />
    <rect x="46" y="42" width="6" height="14" rx="3" fill="#334155" />
    <path d="M14 28l4 8M24 28l4 8M34 28l4 8" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
  </>
)

const bath = (
  <>
    <path d="M8 30h48v10a10 10 0 0 1-10 10H18A10 10 0 0 1 8 40z" fill="#f1f5f9" />
    <path d="M8 30h48" stroke="#cbd5e1" strokeWidth="3" />
    <path d="M44 14h6v14" stroke="#94a3b8" strokeWidth="3" fill="none" />
    <circle cx="20" cy="52" r="3" fill="#cbd5e1" />
    <circle cx="44" cy="52" r="3" fill="#cbd5e1" />
  </>
)

const goldenToilet = (
  <>
    <defs>
      <linearGradient id="gold-wc" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4d47c" />
        <stop offset="1" stopColor="#a16207" />
      </linearGradient>
    </defs>
    <path d="M18 12h28v16H18z" fill="url(#gold-wc)" />
    <path d="M14 28h36l-4 16a8 8 0 0 1-8 6h-12a8 8 0 0 1-8-6z" fill="url(#gold-wc)" />
    <ellipse cx="32" cy="33" rx="12" ry="5" fill="#fff8e1" opacity="0.7" />
    <rect x="26" y="50" width="12" height="6" rx="2" fill="#8a5309" />
  </>
)

const SYMBOLS: Symbol[] = [
  { id: 'brick', name: 'Кирпич', weight: 6, payout: 5, draw: brick },
  { id: 'tile', name: 'Плитка', weight: 5, payout: 8, draw: tile },
  { id: 'laminate', name: 'Ламинат', weight: 4, payout: 10, draw: laminate },
  { id: 'bag', name: 'Мешок смеси', weight: 4, payout: 12, draw: bag },
  { id: 'roller', name: 'Валик', weight: 3, payout: 15, draw: roller },
  { id: 'bath', name: 'Ванна', weight: 2, payout: 25, draw: bath },
  { id: 'wc', name: 'Золотой унитаз', weight: 2, payout: 80, draw: goldenToilet },
]

const POOL = SYMBOLS.flatMap((s) => Array<Symbol>(s.weight).fill(s))
const pick = () => POOL[Math.floor(Math.random() * POOL.length)]

function Tile({ symbol, size = 64 }: { symbol: Symbol; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={symbol.name}>
      {symbol.draw}
    </svg>
  )
}

/* ─────────────────────────  Комментарии прораба  ───────────────────────── */

const FOREMAN = {
  idle: [
    'Смена началась. Крути.',
    'Бетон схватился, можно работать.',
    'Раствор замешан, барабан ждёт.',
  ],
  lose: [
    'Смета выросла. Как обычно.',
    'Плитку привезли битую. Минус.',
    'Заказчик передумал с цветом. Опять.',
    'Соседи снизу уже звонили.',
    'Штробили — попали в проводку.',
  ],
  pair: [
    'Две в ряд — уже что-то.',
    'Пару позиций закрыли, идём дальше.',
    'Не сдача объекта, но и не убыток.',
  ],
  wcOne: [
    'Унитаз золотой — ставку отбили, и на том спасибо.',
    'Один унитаз вытянул смету в ноль.',
  ],
  wcTwo: [
    'Два золотых унитаза! Санузел премиум-класса!',
    'Два унитаза — заказчик доволен, дизайнер в шоке.',
  ],
  win: [
    'Объект сдан без замечаний!',
    'Заказчик подписал акт с первого раза!',
    'Приёмка прошла, премия капнула!',
  ],
  jackpot: [
    'ЗОЛОТОЙ УНИТАЗ! Дизайнер плачет от счастья!',
    'ЗОЛОТОЙ УНИТАЗ! Такое даже в смету не заложишь!',
  ],
  broke: ['Касса пуста. Прораб смотрит осуждающе.'],
}

const say = (list: string[]) => list[Math.floor(Math.random() * list.length)]

/* ─────────────────────────  Состояние  ───────────────────────── */

const STORAGE = 'remont:casino'
const START_BALANCE = 10000

type Saved = { balance: number; spins: number; best: number; jackpots: number }

const load = (): Saved => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) ?? 'null')
    if (raw && typeof raw.balance === 'number') return raw
  } catch {
    /* первый заход */
  }
  return { balance: START_BALANCE, spins: 0, best: 0, jackpots: 0 }
}

const money = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n))

const BETS = [100, 500, 1000, 5000]
const STRIP = 28
const CELL = 88

export function CasinoPage() {
  const [state, setState] = useState<Saved>(load)
  const [bet, setBet] = useState(500)
  const [strips, setStrips] = useState<Symbol[][]>(() =>
    [0, 1, 2].map(() => Array.from({ length: STRIP }, pick)),
  )
  const [spinning, setSpinning] = useState(false)
  const [rolling, setRolling] = useState([false, false, false])
  const [result, setResult] = useState<Symbol[] | null>(null)
  const [payout, setPayout] = useState(0)
  const [jackpot, setJackpot] = useState(false)
  const [phrase, setPhrase] = useState(() => say(FOREMAN.idle))
  const timers = useRef<number[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(state))
  }, [state])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const spin = useCallback(() => {
    if (spinning) return
    if (state.balance < bet) {
      setPhrase(say(FOREMAN.broke))
      return
    }

    timers.current.forEach(clearTimeout)
    setSpinning(true)
    setJackpot(false)
    setPayout(0)
    setResult(null)
    setState((s) => ({ ...s, balance: s.balance - bet, spins: s.spins + 1 }))

    // Барабан — лента случайных символов, последний и есть результат
    const outcome = [pick(), pick(), pick()]
    const next = outcome.map((final) => {
      const strip = Array.from({ length: STRIP - 1 }, pick)
      strip.push(final)
      return strip
    })

    setStrips(next)
    setRolling([true, true, true])

    const stopAt = reduceMotion ? [50, 80, 110] : [900, 1350, 1800]

    stopAt.forEach((ms, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setRolling((r) => {
            const copy = [...r]
            copy[i] = false
            return copy
          })
        }, ms),
      )
    })

    timers.current.push(
      window.setTimeout(() => {
        const [a, b, c] = outcome
        const all = a.id === b.id && b.id === c.id
        const pairFound = a.id === b.id || b.id === c.id || a.id === c.id
        const toilets = outcome.filter((s) => s.id === 'wc').length

        // Золотой унитаз ценен сам по себе: два дают отдельную выплату,
        // один хотя бы возвращает ставку — иначе редкий символ не радует
        let win = 0
        let kind: 'lose' | 'pair' | 'win' | 'jackpot' | 'wcOne' | 'wcTwo' = 'lose'

        if (all) {
          win = bet * a.payout
          kind = a.id === 'wc' ? 'jackpot' : 'win'
        } else if (toilets === 2) {
          win = bet * 6
          kind = 'wcTwo'
        } else if (pairFound) {
          win = Math.round(bet * 1.2)
          kind = 'pair'
        } else if (toilets === 1) {
          win = bet
          kind = 'wcOne'
        }

        const isJackpot = kind === 'jackpot'

        setResult(outcome)
        setPayout(win)
        setJackpot(isJackpot)
        setSpinning(false)
        setPhrase(say(FOREMAN[kind]))

        if (win > 0) {
          setState((s) => ({
            ...s,
            balance: s.balance + win,
            best: Math.max(s.best, win),
            jackpots: s.jackpots + (isJackpot ? 1 : 0),
          }))
        }
      }, (reduceMotion ? 130 : 1800) + 120),
    )
  }, [bet, spinning, state.balance, reduceMotion])

  // Пробел — крутить. Удобнее, чем целиться в кнопку.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        spin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spin])

  const broke = state.balance < BETS[0]

  return (
    <>
      <PageHeader
        title="Казик"
        description="Стройбарабан. Валюта — сметные рубли, на настоящие никак не влияет. Пробел крутит."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2">
            <Coins aria-hidden className="size-4 text-gold" />
            <span className="tnum font-display text-lg font-semibold">{money(state.balance)}</span>
            <span className="text-[13px] text-subtle">см. ₽</span>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card padded={false} className="overflow-hidden">
          <div className="relative bg-navy p-6 md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            {/* Барабаны */}
            <div className="relative mx-auto flex max-w-md justify-center gap-3">
              {strips.map((strip, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/95"
                  style={{ width: CELL, height: CELL }}
                >
                  <div
                    className="flex flex-col items-center"
                    style={{
                      transform: `translateY(-${(strip.length - 1) * CELL}px)`,
                      transition: rolling[i]
                        ? `transform ${reduceMotion ? 0.05 : 0.9 + i * 0.45}s cubic-bezier(.16,.9,.3,1)`
                        : 'none',
                    }}
                  >
                    {strip.map((s, j) => (
                      <span
                        key={j}
                        className="grid shrink-0 place-items-center"
                        style={{ width: CELL, height: CELL }}
                      >
                        <Tile symbol={s} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Итог броска */}
            <div className="relative mt-6 text-center">
              {jackpot && (
                <p className="mb-2 font-display text-2xl font-bold text-gold-300 motion-safe:animate-bounce">
                  ЗОЛОТОЙ УНИТАЗ
                </p>
              )}

              {payout > 0 ? (
                <p className="tnum font-display text-3xl font-bold text-gold-300">
                  +{money(payout)} см. ₽
                </p>
              ) : (
                <p className="font-display text-3xl font-bold text-white/25">
                  {spinning ? '…' : result ? '—' : 'жмите «Крутить»'}
                </p>
              )}

              <p className="mt-2 text-[15px] text-white/70">{phrase}</p>
            </div>
          </div>

          {/* Управление */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-subtle">Ставка:</span>
              {BETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBet(b)}
                  aria-pressed={bet === b}
                  disabled={spinning}
                  className={
                    'tnum min-h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium transition-colors disabled:opacity-50 ' +
                    (bet === b
                      ? 'border-navy bg-navy text-white'
                      : 'border-line bg-white text-navy-600 hover:bg-sand')
                  }
                >
                  {money(b)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {broke && (
                <Button
                  onClick={() => {
                    setState((s) => ({ ...s, balance: s.balance + 5000 }))
                    setPhrase('Прораб дал 5 000 под честное слово. Не подведи.')
                  }}
                >
                  <RotateCcw aria-hidden className="size-4" />
                  Занять у прораба
                </Button>
              )}
              <Button variant="primary" onClick={spin} loading={spinning} disabled={broke}>
                <Zap aria-hidden className="size-4" />
                Крутить за {money(bet)}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Таблица выплат">
            <ul className="flex flex-col gap-2.5">
              {[...SYMBOLS].reverse().map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sand">
                    <Tile symbol={s} size={26} />
                  </span>
                  <span className="flex-1 text-[13px]">{s.name}</span>
                  <span className="tnum font-display text-[13px] font-semibold text-gold">
                    ×{s.payout}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-subtle">
              Три одинаковых — множитель из таблицы. Любые две — 1,2 номинала обратно.
              Два золотых унитаза дают ×6, один возвращает ставку. Чем реже материал,
              тем дороже стоит.
            </p>
          </Card>

          <Card title="Итоги смены">
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-subtle">Бросков</dt>
                <dd className="tnum font-display font-semibold">{money(state.spins)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-subtle">Лучший выигрыш</dt>
                <dd className="tnum font-display font-semibold">{money(state.best)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-subtle">
                  <Trophy aria-hidden className="size-3.5 text-gold" />
                  Золотых унитазов
                </dt>
                <dd className="tnum font-display font-semibold">{state.jackpots}</dd>
              </div>
            </dl>

            <Button
              className="mt-4 w-full"
              onClick={() => {
                setState({ balance: START_BALANCE, spins: 0, best: 0, jackpots: 0 })
                setResult(null)
                setPayout(0)
                setJackpot(false)
                setPhrase('Смету перезалили. Начинаем с чистого листа.')
              }}
            >
              <RotateCcw aria-hidden className="size-4" />
              Перезалить смету
            </Button>
          </Card>
        </div>
      </div>
    </>
  )
}
