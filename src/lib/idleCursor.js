// Hide the mouse cursor after a stretch of inactivity — a kiosk nicety. The
// board runs fullscreen, so hiding the cursor in the page hides it on the whole
// display. Any pointer movement (or click/scroll/touch) brings it back and
// restarts the countdown.
const IDLE_MS = 10_000 // hide after 10 seconds idle

export function initIdleCursor(idleMs = IDLE_MS) {
  let timer

  const hide = () => document.body.classList.add('cursor-idle')
  const show = () => {
    document.body.classList.remove('cursor-idle')
    clearTimeout(timer)
    timer = setTimeout(hide, idleMs)
  }

  const events = ['pointermove', 'pointerdown', 'wheel', 'touchstart']
  events.forEach((e) => window.addEventListener(e, show, { passive: true }))

  show() // start the countdown immediately
}

export default initIdleCursor
