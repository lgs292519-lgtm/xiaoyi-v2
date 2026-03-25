// 固定标签点赞接口
// POST /api/about-tags/vote  { tagId }
const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })

const DEFAULT_FIXED_TAGS = ['社牛', '大胆', '可爱', '害羞', '精灵古怪', '天籁之音', '学歌超快', '神秘']

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

async function seedDefaultFixedTagsIfEmpty(db) {
  const cnt = await db.prepare(`SELECT COUNT(*) as c FROM about_fixed_tags`).first()
  const c = Number(cnt?.c ?? 0)
  if (c > 0) return
  const now = new Date().toISOString()
  for (const tag of DEFAULT_FIXED_TAGS) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO about_fixed_tags (name, likeCount, createdAt)
         VALUES (?, 0, ?)`
      )
      .bind(tag, now)
      .run()
  }
}

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })

  await ensureTables(db)
  await seedDefaultFixedTagsIfEmpty(db)

  if (request.method.toUpperCase() !== 'POST') {
    return json({ error: 'method not allowed' }, { status: 405 })
  }

  const body = await request.json().catch(() => ({}))
  const tagId = body?.tagId
  if (!tagId) return json({ ok: false, error: 'tagId required' }, { status: 400 })

  const updated = await db
    .prepare(`UPDATE about_fixed_tags SET likeCount = likeCount + 1 WHERE id = ?`)
    .bind(tagId)
    .run()

  // D1 的 run 不一定返回最新 likeCount，这里再查一次
  const tag = await db
    .prepare(`SELECT id, name, likeCount, createdAt FROM about_fixed_tags WHERE id = ?`)
    .bind(tagId)
    .first()

  if (!tag) return json({ ok: false, error: 'tag not found' }, { status: 404 })
  return json({ ok: true, tag })
}

