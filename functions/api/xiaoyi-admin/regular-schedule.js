// 管理端：固定安排（regularSchedule）服务器端持久化
// GET  /api/xiaoyi-admin/regular-schedule -> { regularSchedule: [...] }
// POST /api/xiaoyi-admin/regular-schedule -> { regularSchedule: [...] }

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
      `CREATE TABLE IF NOT EXISTS xiaoyi_regular_schedule (
        id INTEGER PRIMARY KEY,
        day TEXT NOT NULL,
        time TEXT NOT NULL,
        activity TEXT NOT NULL
      )`
    )
    .run()

  // 若为空则种子化默认值
  const cnt = await db.prepare(`SELECT COUNT(*) as c FROM xiaoyi_regular_schedule`).first()
  const c = Number(cnt?.c ?? 0)
  if (c > 0) return

  const now = new Date().toISOString()
  void now

  const defaultActivity = '小意出没，歌声相伴'
  const defaults = [
    { id: 1, day: '每天', time: '13:00 - 15:00', activity: defaultActivity },
    { id: 2, day: '每天', time: '16:00 - 18:00', activity: defaultActivity },
    { id: 3, day: '每天', time: '20:00 - 21:00', activity: defaultActivity },
    { id: 4, day: '每天', time: '20:00 - 21:00', activity: defaultActivity },
    { id: 5, day: '每天', time: '20:00 - 21:00', activity: defaultActivity },
  ]

  for (const it of defaults) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO xiaoyi_regular_schedule (id, day, time, activity)
         VALUES (?, ?, ?, ?)`
      )
      .bind(it.id, it.day, it.time, it.activity)
      .run()
  }
}

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })

  await ensureTables(db)

  const method = request.method.toUpperCase()

  if (method === 'GET') {
    const rows = await db
      .prepare(`SELECT id, day, time, activity FROM xiaoyi_regular_schedule ORDER BY id ASC`)
      .all()
    return json({ regularSchedule: rows.results || rows })
  }

  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const list = Array.isArray(body?.regularSchedule) ? body.regularSchedule : []

    // 覆盖写入：先清空再插入
    await db.prepare(`DELETE FROM xiaoyi_regular_schedule`).run()

    for (const it of list) {
      const id = Number(it?.id ?? Date.now())
      const day = safeText(it?.day, 20) || '每天'
      const time = safeText(it?.time, 40)
      const activity = safeText(it?.activity, 60) || ''
      if (!time || !activity) continue

      await db
        .prepare(
          `INSERT OR REPLACE INTO xiaoyi_regular_schedule (id, day, time, activity)
           VALUES (?, ?, ?, ?)`
        )
        .bind(id, day, time, activity)
        .run()
    }

    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, { status: 405 })
}

