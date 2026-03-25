// 清空全部棉花糖留言
// 路由：POST /api/cotton-candy/clear

const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    ...init,
  })

export async function onRequest(context) {
  const { request, env } = context
  const db = env.COTTON_D1
  if (!db) return json({ error: 'D1 binding missing. Please bind D1 to env.COTTON_D1.' }, { status: 500 })

  if (request.method.toUpperCase() !== 'POST') {
    return json({ error: 'method not allowed' }, { status: 405 })
  }

  await db.prepare('DELETE FROM cotton_candy_messages').run()
  return json({ ok: true })
}

