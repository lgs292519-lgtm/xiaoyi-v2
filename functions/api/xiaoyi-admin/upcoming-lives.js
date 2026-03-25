// 管理端：直播预告（upcomingLives）服务器端持久化
// GET  /api/xiaoyi-admin/upcoming-lives -> { upcomingLives: [...] }
// POST /api/xiaoyi-admin/upcoming-lives -> { upcomingLives: [...] }

const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })

const safeText = (v, maxLen) => {
  const s = (v ?? '').toString().trim()
  if (!s) return ''
  return s.slice(0, maxLen)
}

async function ensureTables(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS xiaoyi_upcoming_lives (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        platform TEXT NOT NULL,
        status TEXT NOT NULL
      )`
    )
    .run()

  // 默认：空
}

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })

  await ensureTables(db)

  const method = request.method.toUpperCase()

  if (method === 'GET') {
    const rows = await db
      .prepare(
        `SELECT id, title, date, time, platform, status
         FROM xiaoyi_upcoming_lives
         ORDER BY id DESC`
      )
      .all()
    return json({ upcomingLives: rows.results || rows })
  }

  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const list = Array.isArray(body?.upcomingLives) ? body.upcomingLives : []

    await db.prepare(`DELETE FROM xiaoyi_upcoming_lives`).run()

    for (const it of list) {
      const id = Number(it?.id ?? Date.now())
      const title = safeText(it?.title, 80)
      const date = safeText(it?.date, 20)
      const time = safeText(it?.time, 40)
      const platform = safeText(it?.platform, 20) || 'douyin'
      const status = safeText(it?.status, 20) || '预告'

      if (!title || !date || !time) continue

      await db
        .prepare(
          `INSERT OR REPLACE INTO xiaoyi_upcoming_lives (id, title, date, time, platform, status)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(id, title, date, time, platform, status)
        .run()
    }

    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, { status: 405 })
}

