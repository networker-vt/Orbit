/** Open-Meteo — free API, no key required. https://open-meteo.com/ */

export type CurrentWeather = {
  temperatureC: number
  weatherCode: number
  windKmh: number
  fetchedAt: string
}

const WMO_LABEL_DE: Record<number, string> = {
  0: 'Klar',
  1: 'Überwiegend klar',
  2: 'Teilweise bewölkt',
  3: 'Bedeckt',
  45: 'Nebel',
  48: 'Nebel',
  51: 'Nieselregen',
  53: 'Nieselregen',
  55: 'Niederregen',
  61: 'Regen',
  63: 'Regen',
  65: 'Starkregen',
  71: 'Schnee',
  80: 'Regenschauer',
  95: 'Gewitter',
}

const WMO_LABEL_EN: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Snow',
  80: 'Rain showers',
  95: 'Thunderstorm',
}

export function weatherLabel(code: number, locale: 'de' | 'en'): string {
  const map = locale === 'de' ? WMO_LABEL_DE : WMO_LABEL_EN
  return map[code] ?? (locale === 'de' ? 'Wechselhaft' : 'Mixed')
}

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m')
  url.searchParams.set('timezone', 'auto')
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number }
  }
  const cur = data.current
  if (cur?.temperature_2m == null || cur.weather_code == null) throw new Error('weather shape')
  return {
    temperatureC: cur.temperature_2m,
    weatherCode: cur.weather_code,
    windKmh: cur.wind_speed_10m ?? 0,
    fetchedAt: new Date().toISOString(),
  }
}
