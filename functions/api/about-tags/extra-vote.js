// 粉丝：给备用标签点赞/取消点赞
// POST /api/about-tags/extra-vote { extraId, delta }
// - delta=1 点赞；delta=-1 取消
// - suggestCount 达到 >=3 后自动升级为固定标签（写入 about_fixed_tags 并从 about_extra_tags 删除）

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
  const delta = Number(body?.delta ?? 1)
  if (!extraId) return json({ ok: false, error: 'extraId required' }, { status: 400 })

  const safeDelta = delta === -1 ? -1 : 1

  // 先更新备用标签的 suggestCount（将其视为“点赞计数”）
  await db
    .prepare(
      `UPDATE about_extra_tags
       SET suggestCount = MAX(0, suggestCount + ?)
       WHERE id = ?`
    )
    .bind(safeDelta, extraId)
    .run()

  const extra = await db
    .prepare(`SELECT id, name, suggestCount, createdAt FROM about_extra_tags WHERE id = ?`)
    .bind(extraId)
    .first()

  if (!extra) return json({ ok: false, error: 'extra not found' }, { status: 404 })

  // 达到门槛：自动升级为固定标签
  const promoteThreshold = 3
  if (Number(extra.suggestCount ?? 0) >= promoteThreshold) {
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

    // 返回被升级后的固定标签，便于前端同步“用户已点过”的心心状态
    const fixedAfter = await db
      .prepare(`SELECT id, name, likeCount FROM about_fixed_tags WHERE name = ?`)
      .bind(extra.name)
      .first()

    return json({ ok: true, promoted: true, fixedTag: fixedAfter })
  }

  // 未升级：仅返回更新后的备用标签
  return json({ ok: true, promoted: false, extraTag: extra })
}

