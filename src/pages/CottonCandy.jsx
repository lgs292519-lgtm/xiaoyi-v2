import { useEffect, useMemo, useState } from 'react'
import { FiMessageSquare, FiSend, FiTrash2 } from 'react-icons/fi'
import dataManager from '../utils/dataManager'
import './CottonCandy.css'

const CottonCandy = () => {
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    let alive = true
    dataManager.getCottonCandyMessages().then((list) => {
      if (!alive) return
      setMessages(list || [])
    })
    return () => {
      alive = false
    }
  }, [])

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [messages])

  const refresh = () => {
    dataManager.getCottonCandyMessages().then((list) => setMessages(list || []))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await dataManager.addCottonCandyMessage({ nickname, content })
    if (!ok) return
    setNickname('')
    setContent('')
    refresh()
  }

  const handleDelete = async (id) => {
    const ok = await dataManager.deleteCottonCandyMessage(id)
    if (!ok) {
      window.alert('只能删除自己的棉花糖留言')
      return
    }
    refresh()
  }

  return (
    <div className="cotton-page">
      <section className="cotton-header">
        <div className="container">
          <div className="cotton-header-inner">
            <div className="cotton-title-wrap">
              <h1 className="cotton-title">棉花糖留言</h1>
              <p className="cotton-subtitle">
                <FiMessageSquare /> 留下你想说的话
              </p>
            </div>

            <div className="cotton-stats">
              <span className="cotton-pill">共 {sortedMessages.length} 条</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cotton-form-section">
        <div className="container">
          <form className="cotton-form" onSubmit={handleSubmit}>
            <div className="cotton-form-row">
              <label className="cotton-label">
                昵称（可选）
                <input
                  className="cotton-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="比如：小意的歌迷"
                  maxLength={20}
                />
              </label>
            </div>

            <div className="cotton-form-row">
              <label className="cotton-label">
                留言内容
                <textarea
                  className="cotton-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写点你被治愈的瞬间，或者对我说一句话..."
                  maxLength={800}
                  rows={5}
                  required
                />
              </label>
            </div>

            <div className="cotton-actions">
              <button type="submit" className="btn btn-primary cotton-submit">
                <FiSend /> 发送
              </button>
              <div className="cotton-hint">温柔留言，文明交流。</div>
            </div>
          </form>
        </div>
      </section>

      <section className="cotton-list-section">
        <div className="container">
          {sortedMessages.length === 0 ? (
            <div className="cotton-empty">
              <FiMessageSquare />
              <div>还没有留言，快来做第一位棉花糖吧。</div>
            </div>
          ) : (
            <div className="cotton-list">
              {sortedMessages.map((m) => (
                <div key={m.id} className="cotton-card">
                  <div className="cotton-card-body">
                    <div className="cotton-card-top">
                      <div className="cotton-nickname">{m.nickname || '匿名'}</div>
                      {m.createdAt && (
                        <div className="cotton-createdAt">
                          {new Date(m.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                    <div className="cotton-content">{m.content}</div>
                  </div>

                  <button
                    type="button"
                    className="cotton-delete"
                    onClick={() => handleDelete(m.id)}
                    aria-label="删除留言"
                    title="删除留言"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default CottonCandy

