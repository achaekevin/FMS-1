import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle2, RotateCcw, Church, Sparkles } from 'lucide-react'
import clsx from 'clsx'

// ── Config ────────────────────────────────────────────────────────────────────

const CHURCH = import.meta.env.VITE_CHURCH_NAME || 'Grace Life Church'
const STORAGE_KEY = 'glc_habits_v2'

const HABITS = [
  {
    id: 'morning_prayer',
    label: 'Morning Prayer',
    sub: '15 min of scripture & prayer',
    emoji: '🙏',
    accent: '#a78bfa',
    bg: 'rgba(124,58,237,0.18)',
    border: 'rgba(167,139,250,0.25)',
    type: 'streak',
  },
  {
    id: 'scripture_reading',
    label: 'Daily Scripture Reading',
    sub: 'Chapter of the day',
    emoji: '📖',
    accent: '#60a5fa',
    bg: 'rgba(37,99,235,0.18)',
    border: 'rgba(96,165,250,0.25)',
    type: 'multi',
  },
  {
    id: 'tithe_donation',
    label: 'Tithe or Donation',
    sub: 'Submit weekly contribution',
    emoji: '💰',
    accent: '#f472b6',
    bg: 'rgba(219,39,119,0.18)',
    border: 'rgba(244,114,182,0.25)',
    type: 'status',
  },
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function todayKey() { return new Date().toISOString().slice(0, 10) }

function getWeekDays() {
  const today = new Date()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

// ── Glass card ────────────────────────────────────────────────────────────────

function HabitCard({ habit, habitState, weekDays, onToggle }) {
  const today     = todayKey()
  const doneToday = !!(habitState[today])
  const weekDone  = weekDays.filter(d => habitState[d]).length

  return (
    <div
      onClick={() => onToggle(habit.id, today)}
      style={{
        background: habit.bg,
        borderColor: doneToday ? habit.accent : habit.border,
        boxShadow: doneToday ? `0 0 20px ${habit.accent}30` : '0 2px 12px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      className="relative rounded-2xl p-4 border cursor-pointer transition-all duration-300 select-none active:scale-[0.98] hover:brightness-110"
    >
      {/* Done shimmer overlay */}
      {doneToday && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent)' }} />
      )}

      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {habit.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white text-sm leading-snug">{habit.label}</p>
              <p className="text-white/45 text-xs mt-0.5">{habit.sub}</p>
            </div>
            {doneToday && (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-success-ping"
                style={{ color: habit.accent }} />
            )}
          </div>
        </div>
      </div>

      {/* Progress section */}
      <div className="mt-3.5">
        {habit.type === 'streak' && (
          <>
            <p className="text-white/35 text-xs mb-1.5">Progress</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round((weekDone / 7) * 100))}%`,
                  background: `linear-gradient(90deg, ${habit.accent}66, ${habit.accent})`,
                }} />
            </div>
          </>
        )}

        {habit.type === 'multi' && (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white/35 text-xs">Progress</p>
            <div className="flex gap-1.5">
              {weekDays.map(d => (
                <button key={d} onClick={e => { e.stopPropagation(); onToggle(habit.id, d) }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:opacity-80"
                  style={{
                    background: habitState[d] ? `${habit.accent}25` : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${habitState[d] ? habit.accent + '60' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {habitState[d] && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: habit.accent }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {habit.type === 'status' && (
          <div className="flex items-center gap-2">
            <p className="text-white/35 text-xs">Progress</p>
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold border transition-all"
              style={doneToday
                ? { color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.1)' }
                : { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }
              }>
              {doneToday ? 'Complete' : 'Pending'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Summary Modal ─────────────────────────────────────────────────────────────

function SummaryModal({ state, weekDays, onClose }) {
  const total    = HABITS.reduce((s, h) => s + weekDays.filter(d => (state[h.id] || {})[d]).length, 0)
  const maxTotal = HABITS.length * 7
  const score    = Math.round((total / maxTotal) * 100)
  const msg      = score >= 80 ? '🔥 Excellent week!' : score >= 50 ? '💪 Good progress!' : '🌱 Keep going!'

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl p-6 border border-white/10 z-10"
        style={{ background: 'rgba(12,8,40,0.96)', backdropFilter: 'blur(20px)' }}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Weekly Summary</h2>
            <p className="text-white/40 text-xs mt-0.5">Your habit streak this week</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}>✕</button>
        </div>

        <div className="space-y-5">
          {HABITS.map(h => {
            const hs    = state[h.id] || {}
            const count = weekDays.filter(d => hs[d]).length
            const pct   = Math.min(100, Math.round((count / 7) * 100))
            return (
              <div key={h.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{h.emoji}</span>
                    <span className="text-white/80 text-sm font-medium">{h.label}</span>
                  </div>
                  <span className="text-white/40 text-xs">{count}/7 days</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${h.accent}66, ${h.accent})` }} />
                </div>
                <div className="flex gap-1 mt-1.5">
                  {weekDays.map((d, i) => (
                    <div key={d} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full h-1 rounded-full"
                        style={{ background: hs[d] ? h.accent : 'rgba(255,255,255,0.08)' }} />
                      <span className="text-white/25 text-[9px]">{DAY_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <div className="text-4xl font-black text-white">{score}<span className="text-xl text-white/40">%</span></div>
          <p className="text-white/50 text-sm mt-1">{msg}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HabitTracker() {
  const { user } = useAuth()
  const [state, setState]           = useState(loadState)
  const [showSummary, setShowSummary] = useState(false)
  const weekDays = getWeekDays()
  const today    = todayKey()
  const todayIdx = weekDays.indexOf(today)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  const toggle = (habitId, date) => {
    setState(s => {
      const hs   = { ...(s[habitId] || {}) }
      if (hs[date]) delete hs[date]; else hs[date] = true
      return { ...s, [habitId]: hs }
    })
  }

  const resetWeek = () => {
    setState(s => {
      const next = { ...s }
      HABITS.forEach(h => {
        const hs = { ...(next[h.id] || {}) }
        weekDays.forEach(d => delete hs[d])
        next[h.id] = hs
      })
      return next
    })
  }

  const todayDone = HABITS.filter(h => (state[h.id] || {})[today]).length
  const allDone   = todayDone === HABITS.length

  return (
    // ── Full-bleed wrapper: escape the MainLayout padding + background ──────
    <div className="-m-4 lg:-m-6 min-h-[calc(100vh-64px)] relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0b2b 0%, #0a1628 45%, #0f1e3a 75%, #0b1520 100%)' }}>

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full opacity-25 blur-3xl animate-orb-1"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="absolute top-[50%] right-[10%] w-64 h-64 rounded-full opacity-20 blur-3xl animate-orb-2"
          style={{ background: 'radial-gradient(circle, #db2777, transparent 70%)' }} />
        <div className="absolute bottom-[15%] left-[40%] w-56 h-56 rounded-full opacity-15 blur-3xl animate-orb-3"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)' }} />
      </div>

      {/* Centered column — phone-width feel */}
      <div className="relative z-10 max-w-sm mx-auto px-5 py-7 flex flex-col gap-4">

        {/* ── Church header card ── */}
        <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f5c842, #e9b828)' }}>
            <Church className="w-5 h-5 text-yellow-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{CHURCH}</p>
            <p className="text-white/40 text-xs">Habit Tracker</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={clsx('w-2 h-2 rounded-full transition-colors', allDone ? 'bg-green-400 animate-dot-pulse' : 'bg-white/15')} />
            <span className="text-white/40 text-xs font-medium">{todayDone}/{HABITS.length}</span>
          </div>
        </div>

        {/* ── Week strip ── */}
        <div className="flex justify-between px-1">
          {weekDays.map((d, i) => {
            const isToday = d === today
            const done    = HABITS.some(h => (state[h.id] || {})[d])
            const dayNum  = new Date(d + 'T12:00:00').getDate()
            return (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span className="text-white/30 text-[10px] uppercase tracking-wide">{DAY_LABELS[i]}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={isToday
                    ? { background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: '#fff', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }
                    : done
                    ? { background: 'rgba(124,58,237,0.35)', color: 'rgba(255,255,255,0.9)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }
                  }>
                  {done && !isToday ? '✓' : dayNum}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Greeting ── */}
        {allDone
          ? <p className="text-center text-green-300 text-sm font-medium">🎉 All habits done for today!</p>
          : <p className="text-center text-white/40 text-sm">
              Stay consistent{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </p>
        }

        {/* ── Habit cards ── */}
        {HABITS.map((habit, idx) => (
          <div key={habit.id} className="animate-card-rise" style={{ animationDelay: `${idx * 80}ms` }}>
            <HabitCard
              habit={habit}
              habitState={state[habit.id] || {}}
              weekDays={weekDays}
              onToggle={toggle}
            />
          </div>
        ))}

        {/* ── View Weekly Summary ── */}
        <button
          onClick={() => setShowSummary(true)}
          className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-[0.98] mt-1"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', boxShadow: '0 6px 30px rgba(124,58,237,0.45)' }}>
          View Weekly Summary
        </button>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pb-2">
          <button onClick={resetWeek}
            className="flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset week
          </button>
          <p className="text-white/20 text-[11px]">
            © {new Date().getFullYear()} {CHURCH} · Nairobi, Kenya
          </p>
        </div>
      </div>

      {showSummary && (
        <SummaryModal state={state} weekDays={weekDays} onClose={() => setShowSummary(false)} />
      )}
    </div>
  )
}
