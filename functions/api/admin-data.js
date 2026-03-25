// 管理数据共享存储（跨设备同步）
// Route: /api/admin-data
//
// GET  -> { data: <adminData|null> }
// POST -> { data: <adminData> }  存储到 D1（单行 id=1）
//
// 依赖：env.COTTON_D1（D1 绑定）

const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })

async function ensureTables(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS xiaoyi_admin_data (
        id INTEGER PRIMARY KEY,
        json TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`
    )
    .run()
}

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  if (!db) {
    return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })
  }

  await ensureTables(db)

  const method = request.method.toUpperCase()

  if (method === 'GET') {
    const row = await db.prepare(`SELECT json, updatedAt FROM xiaoyi_admin_data WHERE id = 1`).first()
    if (!row) return json({ data: null, updatedAt: null })
    try {
      return json({ data: JSON.parse(row.json), updatedAt: row.updatedAt || null })
    } catch {
      return json({ data: null, updatedAt: row.updatedAt || null })
    }
  }

  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const data = body?.data
    if (!data) return json({ ok: false, error: 'data required' }, { status: 400 })

    const payload = JSON.stringify(data)
    const now = new Date().toISOString()

    await db
      .prepare(
        `INSERT INTO xiaoyi_admin_data (id, json, updatedAt)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           json = excluded.json,
           updatedAt = excluded.updatedAt`
      )
      .bind(payload, now)
      .run()

    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, { status: 405 })
}

