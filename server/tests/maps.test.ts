import { describe, it, expect } from 'vitest'
import { decodePolyline, distanceKm, samplePoints } from '../src/services/maps.js'

// ---------------------------------------------------------------------------
// decodePolyline
// ---------------------------------------------------------------------------
describe('decodePolyline', () => {
  it('decodes a known single-point polyline', () => {
    // Encoding of { lat: 38.5, lng: -120.2 } from Google's own docs
    const points = decodePolyline('_p~iF~ps|U')
    expect(points).toHaveLength(1)
    expect(points[0].lat).toBeCloseTo(38.5, 4)
    expect(points[0].lng).toBeCloseTo(-120.2, 4)
  })

  it('decodes a two-point polyline', () => {
    // Google example: (38.5, -120.2) → (40.7, -120.95)
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC')
    expect(points).toHaveLength(2)
    expect(points[0].lat).toBeCloseTo(38.5,   4)
    expect(points[0].lng).toBeCloseTo(-120.2,  4)
    expect(points[1].lat).toBeCloseTo(40.7,   4)
    expect(points[1].lng).toBeCloseTo(-120.95, 4)
  })

  it('decodes the three-point Google docs example', () => {
    // (38.5, -120.2) → (40.7, -120.95) → (43.252, -126.453)
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
    expect(points).toHaveLength(3)
    expect(points[2].lat).toBeCloseTo(43.252,  3)
    expect(points[2].lng).toBeCloseTo(-126.453, 3)
  })

  it('returns an empty array for an empty string', () => {
    expect(decodePolyline('')).toEqual([])
  })

  it('preserves point order', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
    // Latitudes should increase across the three points
    expect(points[0].lat).toBeLessThan(points[1].lat)
    expect(points[1].lat).toBeLessThan(points[2].lat)
  })
})

// ---------------------------------------------------------------------------
// distanceKm
// ---------------------------------------------------------------------------
describe('distanceKm', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 51.5, lng: -0.1 }
    expect(distanceKm(p, p)).toBeCloseTo(0, 5)
  })

  it('calculates London to Paris correctly (~340km)', () => {
    const london = { lat: 51.5074, lng: -0.1278 }
    const paris  = { lat: 48.8566, lng:  2.3522 }
    const dist = distanceKm(london, paris)
    // Straight-line haversine distance is ~341km
    expect(dist).toBeGreaterThan(330)
    expect(dist).toBeLessThan(350)
  })

  it('calculates Liverpool to Manchester correctly (~50km)', () => {
    const liverpool   = { lat: 53.4084, lng: -2.9916 }
    const manchester  = { lat: 53.4808, lng: -2.2426 }
    const dist = distanceKm(liverpool, manchester)
    expect(dist).toBeGreaterThan(45)
    expect(dist).toBeLessThan(55)
  })

  it('is symmetric — A→B equals B→A', () => {
    const a = { lat: 53.4084, lng: -2.9916 }
    const b = { lat: 53.4808, lng: -2.2426 }
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 10)
  })

  it('handles points that cross the equator', () => {
    const north = { lat:  10.0, lng: 0.0 }
    const south = { lat: -10.0, lng: 0.0 }
    const dist = distanceKm(north, south)
    // 20 degrees of latitude ≈ 2224km
    expect(dist).toBeGreaterThan(2200)
    expect(dist).toBeLessThan(2250)
  })
})

// ---------------------------------------------------------------------------
// samplePoints
// ---------------------------------------------------------------------------
describe('samplePoints', () => {
  it('always includes the first and last point', () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 2, lng: 0 },
      { lat: 3, lng: 0 },
    ]
    const sampled = samplePoints(points, 50)
    expect(sampled[0]).toEqual(points[0])
    expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1])
  })

  it('returns just start and end when interval exceeds total distance', () => {
    // Two points ~111km apart (1 degree of latitude)
    const points = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
    ]
    // 200km interval — total route is ~111km so no intermediate points
    const sampled = samplePoints(points, 200)
    expect(sampled).toHaveLength(2)
  })

  it('samples at roughly the right interval', () => {
    // Build a straight north-south line of points 10km apart
    // distanceKm of 1 degree lat ≈ 111km, so 0.09° ≈ 10km
    const points = Array.from({ length: 20 }, (_, i) => ({
      lat: i * 0.09,
      lng: 0,
    }))
    // Total ~171km, sample every 50km → expect ~3-4 intermediate points
    const sampled = samplePoints(points, 50)
    expect(sampled.length).toBeGreaterThanOrEqual(3)
    expect(sampled.length).toBeLessThanOrEqual(6)
  })

  it('handles a single-point input', () => {
    const points = [{ lat: 51.5, lng: -0.1 }]
    const sampled = samplePoints(points, 20)
    // First and last are the same point — deduplication not required,
    // but it should not throw
    expect(sampled.length).toBeGreaterThanOrEqual(1)
  })

  it('does not return duplicate consecutive points', () => {
    const points = [
      { lat: 51.5,  lng: -0.1 },
      { lat: 51.51, lng: -0.1 },
      { lat: 51.52, lng: -0.1 },
    ]
    const sampled = samplePoints(points, 1000)
    // With a huge interval only start + end are returned
    // They should not be the same object repeated unless start === end
    expect(sampled).toHaveLength(2)
  })
})
