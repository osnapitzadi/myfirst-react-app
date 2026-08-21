import useWeather from '../state/useWeather.js'

// WMO weather-code -> [label, emoji]. Covers the codes Open-Meteo returns.
const WMO = {
  0: ['Clear sky', '☀️'],
  1: ['Mainly clear', '🌤️'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Dense drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'],
  57: ['Freezing drizzle', '🌧️'],
  61: ['Light rain', '🌦️'],
  63: ['Rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'],
  67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'],
  73: ['Snow', '🌨️'],
  75: ['Heavy snow', '❄️'],
  77: ['Snow grains', '🌨️'],
  80: ['Rain showers', '🌦️'],
  81: ['Rain showers', '🌧️'],
  82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'],
  86: ['Snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm', '⛈️'],
  99: ['Thunderstorm', '⛈️'],
}

// First hero column: current Brampton weather, replacing the old counter.
export default function Weather() {
  const { weather, status } = useWeather()
  const [desc, emoji] = weather ? WMO[weather.code] || ['—', '🌡️'] : ['', '']

  return (
    <section className="hero-stat hero-stat--weather" aria-label="Current weather in Brampton">
      <div className="hero-label">Weather · Brampton</div>
      {status === 'ready' && weather ? (
        <div className="weather-body">
          <div className="weather-main">
            <span className="weather-emoji" aria-hidden="true">
              {emoji}
            </span>
            <span className="weather-temp">{weather.temp}°</span>
          </div>
          <div className="weather-desc">{desc}</div>
          <div className="weather-meta">
            Feels {weather.feels}° · {weather.wind} km/h · {weather.humidity}% RH
          </div>
        </div>
      ) : (
        <div className="weather-body weather-body--muted">
          {status === 'error' ? 'Weather unavailable' : 'Loading weather…'}
        </div>
      )}
    </section>
  )
}
