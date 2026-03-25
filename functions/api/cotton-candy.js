// 棉花糖留言接口（共享给所有设备）
// 路由示例：
// - GET    /api/cotton-candy          -> 列表
// - POST   /api/cotton-candy          -> 新增
// - DELETE /api/cotton-candy (JSON)  -> 删除单条 { id }
//
// 需要在 Cloudflare Pages Functions 绑定 D1：env 变量名建议为 COTTON_D1

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

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  const db = env.COTTON_D1
  if (!db) {
    return json(
      { error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' },
      { status: 500 }
    )
  }

  if (method === 'GET') {
    const rows = await db
      .prepare(
        `SELECT id, nickname, content, createdAt
         FROM cotton_candy_messages
         ORDER BY datetime(createdAt) DESC
         LIMIT 200`
      )
      .all()
    return json({ messages: rows.results || rows })
  }

  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const nickname = safeText(body.nickname, 20) || '匿名'
    const content = safeText(body.content, 800)
    if (!content) return json({ ok: false, error: 'content required' }, { status: 400 })

    const createdAt = new Date().toISOString()
    // D1 参数化插入
    const res = await db
      .prepare(
        `INSERT INTO cotton_candy_messages (nickname, content, createdAt)
         VALUES (?, ?, ?)`
      )
      .bind(nickname, content, createdAt)
      .run()

    // D1 返回 lastRowId 不同版本略有差异，这里用简单查询取最后插入
    const inserted = await db
      .prepare(
        `SELECT id, nickname, content, createdAt
         FROM cotton_candy_messages
         ORDER BY datetime(createdAt) DESC
         LIMIT 1`
      )
      .first()

    return json({ ok: true, message: inserted })
  }

  if (method === 'DELETE') {
    const body = await request.json().catch(() => ({}))
    const id = body.id
    if (!id) return json({ ok: false, error: 'id required' }, { status: 400 })

    await db.prepare(`DELETE FROM cotton_candy_messages WHERE id = ?`).bind(id).run()
    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, { status: 405 })
}

