import { useEffect, useState } from 'react'

// Slide-in settings drawer. Edits everything persisted to localStorage:
// board name, last-incident date, record, near-miss count, custom message bank,
// plus the optional Ollama toggle. Changes apply on Save.
export default function Settings({ open, onClose, state, update, ollamaEnabled, setOllamaEnabled }) {
  const [draft, setDraft] = useState(state)

  // Re-seed the form whenever the drawer opens so it reflects current state.
  useEffect(() => {
    if (open) setDraft(state)
  }, [open, state])

  // Close on Escape for keyboard/kiosk-maintenance use.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function save() {
    update({
      boardName: draft.boardName?.trim() || 'A.L.A.R.A SAFETY BOARD',
      lastIncidentDate: draft.lastIncidentDate,
      record: Math.max(0, Number(draft.record) || 0),
      nearMissCount: Math.max(0, Number(draft.nearMissCount) || 0),
      customLines: linesFromText(draft._customText ?? draft.customLines?.join('\n') ?? ''),
      resetKey: firstChar(draft.resetKey, 'r'),
      nearMissKey: firstChar(draft.nearMissKey, 'n'),
      holdSeconds: clampNum(draft.holdSeconds, 2, 0.5, 10),
    })
    onClose()
  }

  return (
    <>
      <div className={`drawer-scrim ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-label="Board settings">
        <div className="drawer-head">
          <h2>Board Settings</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <label className="field">
            <span>Board name</span>
            <input
              type="text"
              value={draft.boardName || ''}
              onChange={(e) => set('boardName', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Last incident date</span>
            <input
              type="date"
              value={draft.lastIncidentDate || ''}
              onChange={(e) => set('lastIncidentDate', e.target.value)}
            />
            <small>The day counter is computed from this date.</small>
          </label>

          <div className="field-row">
            <label className="field">
              <span>Record (days)</span>
              <input
                type="number"
                min="0"
                value={draft.record ?? 0}
                onChange={(e) => set('record', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Near-misses this month</span>
              <input
                type="number"
                min="0"
                value={draft.nearMissCount ?? 0}
                onChange={(e) => set('nearMissCount', e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>A.L.A.R.A message bank (one line per message)</span>
            <textarea
              rows="6"
              placeholder="Add your own A.L.A.R.A one-liners — merged with the built-in bank."
              value={draft._customText ?? (draft.customLines || []).join('\n')}
              onChange={(e) => set('_customText', e.target.value)}
            />
            <small>These are added to the 50+ built-in lines and rotate daily.</small>
          </label>

          <label className="field field--toggle">
            <input
              type="checkbox"
              checked={ollamaEnabled}
              onChange={(e) => setOllamaEnabled(e.target.checked)}
            />
            <span>
              Live A.L.A.R.A via local Ollama
              <small>Off = built-in bank only (always works offline).</small>
            </span>
          </label>

          <div className="field-group">
            <div className="field-group-title">External button / keyboard triggers</div>
            <div className="field-row">
              <label className="field">
                <span>Reset key (hold)</span>
                <input
                  type="text"
                  maxLength="1"
                  value={draft.resetKey ?? 'r'}
                  onChange={(e) => set('resetKey', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Near-miss key (tap)</span>
                <input
                  type="text"
                  maxLength="1"
                  value={draft.nearMissKey ?? 'n'}
                  onChange={(e) => set('nearMissKey', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Hold (sec)</span>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={draft.holdSeconds ?? 2}
                  onChange={(e) => set('holdSeconds', e.target.value)}
                />
              </label>
            </div>
            <small className="field-hint">
              The board has no on-screen buttons. Map your external button to emit
              one of these keys. Hold the reset key for the set seconds to reset
              the counter; tap the near-miss key to log one. Tap <b>S</b> anytime
              to open this panel.
            </small>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--good" onClick={save}>
            Save
          </button>
        </div>
      </aside>
    </>
  )
}

function linesFromText(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function firstChar(value, fallback) {
  const c = String(value ?? '').trim().charAt(0)
  return c || fallback
}

function clampNum(value, fallback, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
