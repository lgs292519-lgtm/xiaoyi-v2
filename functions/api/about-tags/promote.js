// 管理员：把备用标签提升为固定标签
// POST /api/about-tags/promote  { extraId }

const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })

async function ensureTables(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS about_fixed_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        likeCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      )`
    )
    .run()

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS about_extra_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        suggestCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      )`
    )
    .run()
}

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })

  if (request.method.toUpperCase() !== 'POST') {
    return json({ error: 'method not allowed' }, { status: 405 })
  }

  await ensureTables(db)

  const body = await request.json().catch(() => ({}))
  const extraId = body?.extraId
  if (!extraId) return json({ ok: false, error: 'extraId required' }, { status: 400 })

  const extra = await db
    .prepare(`SELECT id, name, suggestCount FROM about_extra_tags WHERE id = ?`)
    .bind(extraId)
    .first()

  if (!extra) return json({ ok: false, error: 'extra not found' }, { status: 404 })

  const now = new Date().toISOString()

  const fixed = await db
    .prepare(`SELECT id, likeCount FROM about_fixed_tags WHERE name = ?`)
    .bind(extra.name)
    .first()

  if (fixed) {
    await db
      .prepare(`UPDATE about_fixed_tags SET likeCount = likeCount + ? WHERE id = ?`)
      .bind(extra.suggestCount, fixed.id)
      .run()
  } else {
    await db
      .prepare(
        `INSERT INTO about_fixed_tags (name, likeCount, createdAt)
         VALUES (?, ?, ?)`
      )
      .bind(extra.name, extra.suggestCount || 0, now)
      .run()
  }

  await db.prepare(`DELETE FROM about_extra_tags WHERE id = ?`).bind(extra.id).run()

  return json({ ok: true })
}

