import { onRequestGet, onRequestPut } from '../functions/api/state.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/state') {
      if (request.method === 'GET') return onRequestGet({ request, env })
      if (request.method === 'PUT') return onRequestPut({ request, env })

      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, PUT' },
      })
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'NOT_FOUND' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return env.ASSETS.fetch(request)
  },
}
