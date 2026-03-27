import type { FastifyPluginAsync } from 'fastify'

const API_KEY = process.env.GOOGLE_MAPS_API_KEY!

export const previewRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get<{ Querystring: { origin: string; destination: string } }>(
    '/',
    async (req, reply) => {
      const { origin, destination } = req.query

      if (!origin?.trim() || !destination?.trim()) {
        return reply.status(400).send({ error: 'origin and destination are required' })
      }

      // Build a Static Maps URL with the route drawn as a polyline.
      // We use the Directions API path= parameter which draws the actual road route.
      const params = new URLSearchParams({
        size:        '640x300',
        scale:       '2',
        maptype:     'roadmap',
        path:        `enc:${await getEncodedRoute(origin, destination)}`,
        markers:     `color:green|label:A|${origin}`,
        key:         API_KEY,
      })
      // Add destination marker separately (URLSearchParams dedupes keys)
      const url = `https://maps.googleapis.com/maps/api/staticmap?${params}&markers=color:red|label:B|${encodeURIComponent(destination)}`

      // Proxy the image through our server so the API key never reaches the client
      const img = await fetch(url)
      if (!img.ok) {
        return reply.status(502).send({ error: 'Failed to fetch map preview' })
      }

      reply.header('Content-Type', img.headers.get('content-type') ?? 'image/png')
      reply.header('Cache-Control', 'public, max-age=3600')
      return reply.send(Buffer.from(await img.arrayBuffer()))
    }
  )
}

// Fetch the encoded polyline for the route from the Directions API
async function getEncodedRoute(origin: string, destination: string): Promise<string> {
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString())
  const data = await res.json() as any

  if (data.status !== 'OK' || !data.routes?.[0]) {
    throw new Error(`Could not preview route: ${data.status}`)
  }

  return data.routes[0].overview_polyline.points
}
