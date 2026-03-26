// 管理员：删除固定/备用标签
// POST /api/about-tags/delete { tagType: 'fixed'|'extra', id, adminPass? }

const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })

function safeText(v, maxLen) {
  const s = (v ?? '').toString().trim()
  if (!s) return ''
  return s.slice(0, maxLen)
}

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
  const ADMIN_PASSWORD = 'xiaoyi2429'

  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })
  if (request.method.toUpperCase() !== 'POST') return json({ error: 'method not allowed' }, { status: 405 })

  await ensureTables(db)

  const body = await request.json().catch(() => ({}))
  const tagType = body?.tagType
  const id = body?.id
  const adminPass = safeText(body?.adminPass, 128)

  if (!adminPass || adminPass !== ADMIN_PASSWORD) return json({ ok: false, error: 'forbidden' }, { status: 403 })
  if (tagType !== 'fixed' && tagType !== 'extra') return json({ ok: false, error: 'tagType invalid' }, { status: 400 })
  const tagId = Number(id)
  if (!Number.isFinite(tagId)) return json({ ok: false, error: 'id required' }, { status: 400 })

  const table = tagType === 'fixed' ? 'about_fixed_tags' : 'about_extra_tags'

  const row = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(tagId).first()
  if (!row) return json({ ok: false, error: 'not found' }, { status: 404 })

  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(tagId).run()
  return json({ ok: true })
}

