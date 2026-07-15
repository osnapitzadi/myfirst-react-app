// A.L.A.R.A's v2 brain — optional local Ollama riff.
//
// This is bolt-on and fails SAFE: if Ollama isn't installed, isn't running, or
// times out, the caller falls back to the baked-in v1 line bank. The board
// never breaks because of this.
//
// On the kiosk PC:
//   1. Install Ollama, pull a small model, e.g. `ollama pull llama3.2:3b`
//   2. Allow the browser origin to reach it:
//        setx OLLAMA_ORIGINS "*"     (Windows)   or   export OLLAMA_ORIGINS="*"
//      then restart the Ollama service.
//   3. Flip `enabled` on in the Settings drawer (or ?ollama=1 in the URL).

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'llama3.2:3b'
const TIMEOUT_MS = 8000

function buildPrompt({ radiation, isotope, streak }) {
  const facts = []
  if (typeof streak === 'number') facts.push(`The site has gone ${streak} days with no recordable incident.`)
  if (isotope?.name) {
    facts.push(
      `Isotope of the day: ${isotope.name}` +
        (isotope.halfLife ? `, half-life ${isotope.halfLife}.` : '.')
    )
  }
  if (radiation?.value != null) {
    facts.push(`A live radiation reading came in at ${radiation.value} ${radiation.unit || 'CPM'}${radiation.location ? ` near ${radiation.location}` : ''}.`)
  }
  return [
    'You are A.L.A.R.A, the hard-hat site safety officer for a warehouse that',
    'handles radioactive materials. ALARA = As Low As Reasonably Achievable.',
    'Your voice: dry, punny, a little bossy, secretly proud of the crew.',
    'Write ONE safety message of the day — a single sentence, under 140',
    'characters, no emoji, no hashtags, no quotes around it. Work in one of',
    "today's facts if it fits naturally.",
    '',
    'Facts:',
    ...facts.map((f) => `- ${f}`),
    '',
    'Message:',
  ].join('\n')
}

// Returns a string on success, or null on any failure (caller falls back).
export async function fetchAlaraLine(context) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: buildPrompt(context),
        stream: false,
        options: { temperature: 0.9, num_predict: 80 },
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = (data.response || '').trim().replace(/^["']|["']$/g, '')
    return text.length > 3 ? text : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export default fetchAlaraLine
