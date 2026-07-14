import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useBoard from './state/useBoard.js'
import useToday from './state/useToday.js'
import useAlaraMessage from './state/useAlaraMessage.js'
import Clock from './components/Clock.jsx'
import HeroCounter from './components/HeroCounter.jsx'
import Mascot from './components/Mascot.jsx'
import DailyData from './components/DailyData.jsx'
import RecordBar from './components/RecordBar.jsx'
import Controls from './components/Controls.jsx'
import Settings from './components/Settings.jsx'
import Trefoil from './components/Trefoil.jsx'

// Persist the Ollama toggle on its own so it's independent of board state.
const OLLAMA_KEY = 'alara.ollama.enabled'

// Map streak length to A.L.A.R.A's baseline mood.
function moodForStreak(streak) {
  if (streak <= 9) return 'sweating'
  if (streak <= 29) return 'okay'
  return 'cool'
}

export default function App() {
  const { state, streak, update, reportIncident, logNearMiss } = useBoard()
  const { today, status } = useToday()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [alarm, setAlarm] = useState(false) // reset-gag beacon/shake/faceplant
  const [justLogged, setJustLogged] = useState(false) // near-miss pop
  const [ollamaEnabled, setOllamaEnabled] = useState(
    () => localStorage.getItem(OLLAMA_KEY) === '1'
  )
  const alarmTimer = useRef(null)
  const popTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem(OLLAMA_KEY, ollamaEnabled ? '1' : '0')
  }, [ollamaEnabled])

  // Context handed to A.L.A.R.A's v2 brain so she can riff on real data.
  const context = useMemo(
    () => ({
      streak,
      radiation: today?.radiation,
      isotope: today?.isotope,
    }),
    [streak, today]
  )
  const { message, source } = useAlaraMessage({
    customLines: state.customLines,
    ollamaEnabled,
    context,
  })

  // During the alarm, A.L.A.R.A faceplants; otherwise her mood tracks the streak.
  const mood = alarm ? 'faceplant' : moodForStreak(streak)

  // The reset gag: fire the beacon/shake/faceplant, then commit the reset and
  // let it ride for a few seconds of drama before clearing.
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

  return (
    <div className={`board ${alarm ? 'board--alarm' : ''}`}>
      {/* amber beacon overlay for the reset gag */}
      <div className={`beacon ${alarm ? 'beacon--on' : ''}`} aria-hidden="true" />

      <div className="caution-tape caution-tape--top" aria-hidden="true" />

      <header className="board-head">
        <div className="board-title">
          <Trefoil size={40} className="board-trefoil" spin={alarm} />
          <h1>{state.boardName}</h1>
        </div>
        <div className="board-head-right">
          <Clock />
          <button
            className="settings-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <main className="board-main">
        <HeroCounter days={streak} alarm={alarm} />

        <div className="board-grid">
          <div className="panel panel--mascot">
            <Corners />
            <Mascot mood={mood} message={message} source={source} />
          </div>

          <div className="panel panel--stats">
            <Corners />
            <RecordBar streak={streak} record={state.record} />
            <Controls
              nearMissCount={state.nearMissCount}
              onReportIncident={handleReportIncident}
              onLogNearMiss={handleLogNearMiss}
              justLogged={justLogged}
            />
          </div>
        </div>

        <DailyData today={today} status={status} />
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
