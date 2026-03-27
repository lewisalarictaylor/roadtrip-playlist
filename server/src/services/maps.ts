import { fetch } from 'undici'

interface RoutePoint { lat: number; lng: number }
interface CityPoint { name: string; mbid: string | null }

// Decode Google's encoded polyline format into lat/lng points
function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

// Haversine distance between two lat/lng points in km
function distanceKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

// Sample one point every `intervalKm` kilometres along the polyline
function samplePoints(points: RoutePoint[], intervalKm: number): RoutePoint[] {
  const sampled: RoutePoint[] = [points[0]]
  let accumulated = 0
  for (let i = 1; i < points.length; i++) {
    accumulated += distanceKm(points[i - 1], points[i])
    if (accumulated >= intervalKm) { sampled.push(points[i]); accumulated = 0 }
  }
  sampled.push(points[points.length - 1])
  return sampled
}

const API_KEY = process.env.GOOGLE_MAPS_API_KEY!

export const mapsService = {
  async getRoute(origin: string, destination: string): Promise<string> {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
    url.searchParams.set('origin', origin)
    url.searchParams.set('destination', destination)
    url.searchParams.set('key', API_KEY)
    const res = await fetch(url.toString())
    const data = await res.json() as any

    if (data.status !== 'OK') {
      const messages: Record<string, string> = {
        ZERO_RESULTS:       `No route found between "${origin}" and "${destination}". Check the place names are correct and that a driveable route exists between them.`,
        NOT_FOUND:          `One or both locations couldn't be found: "${origin}" → "${destination}". Try being more specific, e.g. adding a country name.`,
        MAX_WAYPOINTS_EXCEEDED: 'Too many waypoints in this route.',
        INVALID_REQUEST:    'The route request was invalid. Check your origin and destination.',
        REQUEST_DENIED:     'Google Maps API request was denied. Check your API key.',
        OVER_DAILY_LIMIT:   'Google Maps API daily quota exceeded.',
        UNKNOWN_ERROR:      'Google Maps returned an unexpected error. Please try again.',
      }
      throw new Error(messages[data.status] ?? `Could not get directions (${data.status}).`)
    }

    return data.routes[0].overview_polyline.points
  },

  async extractCities(encodedPolyline: string, intervalKm: number): Promise<CityPoint[]> {
    const points = decodePolyline(encodedPolyline)
    const sampled = samplePoints(points, intervalKm)
    const seen = new Set<string>()
    const cities: CityPoint[] = []

    for (const point of sampled) {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
      url.searchParams.set('latlng', `${point.lat},${point.lng}`)
      url.searchParams.set('result_type', 'locality|administrative_area_level_2')
      url.searchParams.set('key', API_KEY)

      const res = await fetch(url.toString())
      const data = await res.json() as any
      if (!data.results?.length) continue

      const name = data.results[0].address_components
        .find((c: any) => c.types.includes('locality') || c.types.includes('administrative_area_level_2'))
        ?.long_name
        ?.trim()

      if (name && name.length > 0 && !seen.has(name)) {
        seen.add(name)
        cities.push({ name, mbid: null })
      }

      // Respect Google geocoding rate limits
      await new Promise(r => setTimeout(r, 50))
    }

    return cities
  }
}