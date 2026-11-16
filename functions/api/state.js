const COOKIE_NAME = 'fandian_id'
const CATEGORIES = ['清淡', '重口', '素食']

function json(data, status = 200, cookie) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })

  if (cookie) headers.set('Set-Cookie', cookie)
  return new Response(JSON.stringify(data), { status, headers })
}

function getVisitorId(request) {
  const cookies = request.headers.get('Cookie') || ''
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match?.[1] || crypto.randomUUID()
}

function visitorCookie(request, visitorId) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE_NAME}=${visitorId}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax${secure}`
}

function getDatabase(context) {
  return context.env?.DB || null
}

function validateState(input) {
  if (!input || !Array.isArray(input.meals) || !Array.isArray(input.history)) {
    throw new Error('数据格式不正确')
  }

  if (input.meals.length > 12 || input.history.length > 5) {
    throw new Error('数据数量超过限制')
  }

  const meals = input.meals.map((meal) => {
    if (
      !meal ||
      typeof meal.id !== 'string' ||
      meal.id.length > 100 ||
      typeof meal.name !== 'string' ||
      !meal.name.trim() ||
      meal.name.trim().length > 8 ||
      typeof meal.emoji !== 'string' ||
      meal.emoji.length > 16 ||
      !CATEGORIES.includes(meal.category)
    ) {
      throw new Error('菜单数据不正确')
    }

    return {
      id: meal.id,
      name: meal.name.trim(),
      emoji: meal.emoji,
      category: meal.category,
    }
  })

  const history = input.history.map((item) => {
    if (
      !item ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      item.name.trim().length > 8 ||
      typeof item.emoji !== 'string' ||
      item.emoji.length > 16 ||
      typeof item.time !== 'string' ||
      item.time.length > 50
    ) {
      throw new Error('历史记录不正确')
    }

    return {
      name: item.name.trim(),
      emoji: item.emoji,
      time: item.time,
    }
  })

  return { meals, history }
}

async function ensureVisitor(db, visitorId) {
  await db
    .prepare('INSERT OR IGNORE INTO visitors (visitor_id, initialized) VALUES (?, 0)')
    .bind(visitorId)
    .run()
}

export async function onRequestGet(context) {
  const db = getDatabase(context)
  if (!db) return json({ error: 'D1_NOT_CONFIGURED' }, 503)

  const visitorId = getVisitorId(context.request)

  try {
    await ensureVisitor(db, visitorId)
    const visitor = await db
      .prepare('SELECT initialized FROM visitors WHERE visitor_id = ?')
      .bind(visitorId)
      .first()
    const meals = await db
      .prepare('SELECT id, name, emoji, category FROM meals WHERE visitor_id = ? ORDER BY position ASC')
      .bind(visitorId)
      .all()
    const history = await db
      .prepare('SELECT name, emoji, picked_at AS time FROM history WHERE visitor_id = ? ORDER BY position ASC')
      .bind(visitorId)
      .all()

    return json(
      {
        initialized: visitor?.initialized === 1,
        meals: meals.results || [],
        history: history.results || [],
      },
      200,
      visitorCookie(context.request, visitorId),
    )
  } catch {
    return json({ error: 'D1_QUERY_FAILED' }, 500)
  }
}

export async function onRequestPut(context) {
  const db = getDatabase(context)
  if (!db) return json({ error: 'D1_NOT_CONFIGURED' }, 503)

  const visitorId = getVisitorId(context.request)

  try {
    const state = validateState(await context.request.json())
    await ensureVisitor(db, visitorId)

    const statements = [
      db
        .prepare('UPDATE visitors SET initialized = 1 WHERE visitor_id = ?')
        .bind(visitorId),
      db.prepare('DELETE FROM meals WHERE visitor_id = ?').bind(visitorId),
      db.prepare('DELETE FROM history WHERE visitor_id = ?').bind(visitorId),
      ...state.meals.map((meal, position) =>
        db
          .prepare(
            'INSERT INTO meals (visitor_id, id, name, emoji, category, position) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(visitorId, meal.id, meal.name, meal.emoji, meal.category, position),
      ),
      ...state.history.map((item, position) =>
        db
          .prepare(
            'INSERT INTO history (id, visitor_id, name, emoji, picked_at, position) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(crypto.randomUUID(), visitorId, item.name, item.emoji, item.time, position),
      ),
    ]

    await db.batch(statements)
    return json({ ok: true }, 200, visitorCookie(context.request, visitorId))
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'INVALID_JSON' }, 400)
    if (error instanceof Error && error.message === '数据格式不正确') {
      return json({ error: error.message }, 400)
    }
    if (error instanceof Error && (error.message === '数据数量超过限制' || error.message === '菜单数据不正确' || error.message === '历史记录不正确')) {
      return json({ error: error.message }, 400)
    }
    return json({ error: 'D1_WRITE_FAILED' }, 500)
  }
}
