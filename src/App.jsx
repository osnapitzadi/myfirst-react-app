import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useBoard from './state/useBoard.js'
import useToday from './state/useToday.js'
import useAlaraMessage from './state/useAlaraMessage.js'
import Clock from './components/Clock.jsx'
import HeroCounter from './components/HeroCounter.jsx'
import SafetyMessage from './components/SafetyMessage.jsx'
import DailyData from './components/DailyData.jsx'
import RecordBar from './components/RecordBar.jsx'
import Settings from './components/Settings.jsx'
import Trefoil from './components/Trefoil.jsx'

// Persist the Ollama toggle on its own so it's independent of board state.
const OLLAMA_KEY = 'alara.ollama.enabled'

// Map streak length to the message panel's accent tone.
function toneForStreak(streak) {
  if (streak <= 9) return 'warn'
  if (streak <= 29) return 'ok'
  return 'good'
}

export default function App() {
  const { state, streak, update, reportIncident, logNearMiss } = useBoard()
  const { today, status } = useToday()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [alarm, setAlarm] = useState(false) // reset-gag beacon/shake
  const [justLogged, setJustLogged] = useState(false) // near-miss pop
  const [holdPct, setHoldPct] = useState(0) // hold-to-reset progress (0..100)
  const [ollamaEnabled, setOllamaEnabled] = useState(
    () => localStorage.getItem(OLLAMA_KEY) === '1'
  )
  const alarmTimer = useRef(null)
  const popTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem(OLLAMA_KEY, ollamaEnabled ? '1' : '0')
  }, [ollamaEnabled])

  const context = useMemo(
    () => ({ streak, radiation: today?.radiation, isotope: today?.isotope }),
    [streak, today]
  )
  const { message, source } = useAlaraMessage({
    customLines: state.customLines,
    ollamaEnabled,
    context,
  })

  const tone = alarm ? 'alarm' : toneForStreak(streak)

  // The reset gag: fire the beacon/shake, commit the reset, let it ride a few
  // seconds of drama before clearing.
  const handleReportIncident = useCallback(() => {
    reportIncident()
    setAlarm(true)
    clearTimeout(alarmTimer.current)
    alarmTimer.current = setTimeout(() => setAlarm(false), 5000)
  }, [reportIncident])

  const handleLogNearMiss = useCallback(() => {
    logNearMiss()
    setJustLogged(true)
    clearTimeout(popTimer.current)
    popTimer.current = setTimeout(() => setJustLogged(false), 1200)
  }, [logNearMiss])

  useEffect(
    () => () => {
      clearTimeout(alarmTimer.current)
      clearTimeout(popTimer.current)
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Keyboard controls. No on-screen buttons: an external button (foot pedal,
  // macropad, GPIO/Arduino-to-HID, or a plain keyboard) emits a keypress.
  //   - HOLD resetKey for holdSeconds  -> report incident + reset (deliberate)
  //   - TAP  nearMissKey               -> log a near-miss
  //   - TAP  S                         -> open/close the maintenance settings
  // The hold requirement means a stray bump can't wipe the streak.
  // ---------------------------------------------------------------------------
  const hold = useRef({ active: false, raf: 0, start: 0 })
  const holdSeconds = Math.max(0.4, Number(state.holdSeconds) || 2)
  const resetKey = (state.resetKey || 'r').toLowerCase()
  const nearMissKey = (state.nearMissKey || 'n').toLowerCase()

  const cancelHold = useCallback(() => {
    if (hold.current.raf) cancelAnimationFrame(hold.current.raf)
    hold.current = { active: false, raf: 0, start: 0 }
    setHoldPct(0)
  }, [])

  useEffect(() => {
    // Don't hijack keys while someone is typing in the settings drawer.
    const isTyping = () => {
      const t = document.activeElement
      return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
    }

    const onKeyDown = (e) => {
      if (e.repeat) return // ignore auto-repeat; we time the hold ourselves
      const key = e.key.toLowerCase()

      if (key === 's' && !isTyping()) {
        setSettingsOpen((o) => !o)
        return
      }
      if (isTyping()) return

      if (key === nearMissKey) {
        handleLogNearMiss()
        return
      }
      if (key === resetKey && !hold.current.active) {
        hold.current.active = true
        hold.current.start = performance.now()
        const tick = (now) => {
          const pct = Math.min(100, ((now - hold.current.start) / (holdSeconds * 1000)) * 100)
          setHoldPct(pct)
          if (pct >= 100) {
            cancelHold()
            handleReportIncident()
          } else {
            hold.current.raf = requestAnimationFrame(tick)
          }
        }
        hold.current.raf = requestAnimationFrame(tick)
      }
    }

    const onKeyUp = (e) => {
      if (e.key.toLowerCase() === resetKey) cancelHold()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      cancelHold()
    }
  }, [resetKey, nearMissKey, holdSeconds, handleReportIncident, handleLogNearMiss, cancelHold])

  const holding = holdPct > 0 && !alarm

  return (
    <div className={`board ${alarm ? 'board--alarm' : ''}`}>
      <div className={`beacon ${alarm ? 'beacon--on' : ''}`} aria-hidden="true" />

      {/* hold-to-reset feedback — only visible while the reset key is held */}
      {holding && (
        <div className="hold" aria-hidden="true">
          <div className="hold-card">
            <div className="hold-label">Reporting Incident…</div>
            <div className="hold-track">
              <div className="hold-fill" style={{ width: `${holdPct}%` }} />
            </div>
            <div className="hold-sub">Keep holding to reset the counter</div>
          </div>
        </div>
      )}

      <div className="caution-tape caution-tape--top" aria-hidden="true" />

      <header className="board-head">
        <div className="board-title">
          <Trefoil size={34} className="board-trefoil" spin={alarm} />
          <h1>{state.boardName}</h1>
        </div>
        <Clock />
      </header>

      <main className="board-main">
        <HeroCounter days={streak} alarm={alarm} />

        <div className="info-band">
          <div className="panel panel--message">
            <Corners />
            <SafetyMessage tone={tone} message={message} source={source} />
          </div>

          <div className="panel panel--stats">
            <Corners />
            <RecordBar streak={streak} record={state.record} />
            <div className={`nearmiss-tally ${justLogged ? 'nearmiss-tally--pop' : ''}`}>
              <span className="nearmiss-count">{state.nearMissCount}</span>
              <span className="nearmiss-label">
                Near-misses caught
                <br />
                this month
              </span>
            </div>
          </div>

          <DailyData today={today} status={status} />
        </div>
      </main>

      <div className="caution-tape caution-tape--bottom" aria-hidden="true" />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        state={state}
        update={update}
        ollamaEnabled={ollamaEnabled}
        setOllamaEnabled={setOllamaEnabled}
      />
    </div>
  )
}

// Corner bolts on a panel.
function Corners() {
  return (
    <>
      <span className="bolt bolt--tl" />
      <span className="bolt bolt--tr" />
      <span className="bolt bolt--bl" />
      <span className="bolt bolt--br" />
    </>
  )
}
