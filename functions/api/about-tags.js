// 关于页面标签接口（固定标签 + 备用标签提名）
// 路由示例：
// - GET  /api/about-tags               -> { fixed: [...], extras: [...] }
// - POST /api/about-tags               -> 提交备用标签 { name }
//
// 依赖：Cloudflare Pages Functions 绑定 D1
// 为了减少你已有绑定配置的工作量，这里复用 env.COTTON_D1

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

const DEFAULT_FIXED_TAGS = ['社牛', '大胆', '可爱', '害羞', '精灵古怪', '天籁之音', '学歌超快', '神秘']

async function ensureTables(db) {
  // 固定标签：可被点赞
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

  // 备用标签：由粉丝提交提名，管理员可升级为固定标签
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

async function seedDefaultFixedTags(db) {
  // 允许“重置为默认数据/删除后再恢复”：
  // 无论当前 about_fixed_tags 表是否为空，都补齐默认固定标签（name 唯一，不会覆盖原 likeCount）。
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
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  const db = env.COTTON_D1
  if (!db) {
    return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })
  }

  await ensureTables(db)
  await seedDefaultFixedTags(db)

  if (method === 'GET') {
    const fixedRows = await db
      .prepare(
        `SELECT id, name, likeCount, createdAt
         FROM about_fixed_tags
         ORDER BY likeCount DESC, datetime(createdAt) DESC
         LIMIT 100`
      )
      .all()

    const extraRows = await db
      .prepare(
        `SELECT id, name, suggestCount, createdAt
         FROM about_extra_tags
         ORDER BY suggestCount DESC, datetime(createdAt) DESC
         LIMIT 100`
      )
      .all()

    return json({
      fixed: fixedRows.results || fixedRows,
      extras: extraRows.results || extraRows,
    })
  }

  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const name = safeText(body?.name, 20)
    if (!name) return json({ ok: false, error: 'name required' }, { status: 400 })

    // 如果已是固定标签，则返回固定信息（不再进入备用池）
    const fixed = await db.prepare(`SELECT id, name, likeCount FROM about_fixed_tags WHERE name = ?`)
      .bind(name)
      .first()
    if (fixed) {
      return json({ ok: true, type: 'fixed', fixed })
    }

    const now = new Date().toISOString()
    await db
      .prepare(
        `INSERT INTO about_extra_tags (name, suggestCount, createdAt)
         VALUES (?, 1, ?)
         ON CONFLICT(name) DO UPDATE SET
           suggestCount = suggestCount + 1`
      )
      .bind(name, now)
      .run()

    const extra = await db
      .prepare(`SELECT id, name, suggestCount, createdAt FROM about_extra_tags WHERE name = ?`)
      .bind(name)
      .first()

    return json({ ok: true, extra })
  }

  return json({ error: 'method not allowed' }, { status: 405 })
}

