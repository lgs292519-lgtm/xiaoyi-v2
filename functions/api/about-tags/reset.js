// 管理员：重置标签到默认值
// POST /api/about-tags/reset { adminPass }

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

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  const ADMIN_PASSWORD = 'xiaoyi2429'

  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })
  if (request.method.toUpperCase() !== 'POST') return json({ error: 'method not allowed' }, { status: 405 })

  await ensureTables(db)

  const body = await request.json().catch(() => ({}))
  const adminPass = String(body?.adminPass ?? '').trim()
  if (adminPass !== ADMIN_PASSWORD) return json({ ok: false, error: 'forbidden' }, { status: 403 })

  // 默认策略：
  // - 清空备用标签（恢复“默认页面”状态）
  // - 固定标签只保留默认集合内的名称；缺失的补回来
  await db.prepare(`DELETE FROM about_extra_tags`).run()

  const placeholders = DEFAULT_FIXED_TAGS.map(() => '?').join(',')
  const params = DEFAULT_FIXED_TAGS
  await db
    .prepare(
      `DELETE FROM about_fixed_tags WHERE name NOT IN (${placeholders})`
    )
    .bind(...params)
    .run()

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

  return json({ ok: true })
}

