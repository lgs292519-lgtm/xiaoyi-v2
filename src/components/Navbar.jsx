import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMusic, FiShoppingBag, FiRadio, FiUser, FiMessageSquare } from 'react-icons/fi'
import dataManager from '../utils/dataManager'
import './Navbar.css'

const AVATAR_SRC = '/images/avatar.jpg'

function parseDouyinLiveId(douyinLive = '') {
  const s = String(douyinLive || '').trim()
  if (!s) return ''
  const m = s.match(/live\.douyin\.com\/(\d+)/)
  if (m?.[1]) return m[1]
  // allow passing raw numeric id
  const m2 = s.match(/^(\d{5,})$/)
  return m2?.[1] || ''
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_SRC)
  const [douyinLive, setDouyinLive] = useState('')
  const [isLiveNow, setIsLiveNow] = useState(false)
  const [liveBadgeState, setLiveBadgeState] = useState('unknown') // unknown | live | off
  const [liveTitle, setLiveTitle] = useState('')
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const data = dataManager.getData()
    setAvatarUrl(data?.avatarUrl || AVATAR_SRC)
    setDouyinLive(data?.contact?.douyinLive || '')

    const liveId = parseDouyinLiveId(data?.contact?.douyinLive || '')

    const fetchLiveStatus = async () => {
      if (!liveId) {
        setLiveBadgeState('off')
        setIsLiveNow(false)
        setLiveTitle('')
        return
      }
      try {
        const res = await fetch(`/api/douyin-status?live_id=${encodeURIComponent(liveId)}`, {
          headers: { accept: 'application/json; charset=utf-8' },
        })
        const j = await res.json().catch(() => ({}))
        const isLive = j?.is_live === true
        const isUnknown = j?.is_live === null || typeof j?.is_live === 'undefined'

        setIsLiveNow(isLive)
        setLiveTitle(j?.title || '')
        setLiveBadgeState(isUnknown ? 'unknown' : isLive ? 'live' : 'off')
      } catch {
        setIsLiveNow(false)
        setLiveTitle('')
        setLiveBadgeState('unknown')
      }
    }

    // 首次 + 每分钟更新一次
    fetchLiveStatus()
    const t = setInterval(fetchLiveStatus, 60_000)
    return () => clearInterval(t)
  }, [])

  const navItems = [
    { path: '/', label: '首页', icon: <FiUser /> },
    { path: '/playlist', label: '歌单', icon: <FiMusic /> },
    { path: '/goods', label: '周边', icon: <FiShoppingBag /> },
    { path: '/live', label: '直播', icon: <FiRadio /> },
    { path: '/cotton-candy', label: '棉花糖', icon: <FiMessageSquare /> },
    { path: '/about', label: '关于', icon: <FiUser /> },
  ]

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-avatar">
            {!avatarError ? (
              <img src={avatarUrl} alt="小意OVO" onError={() => setAvatarError(true)} />
            ) : (
              <span className="logo-fallback">意</span>
            )}
          </span>

          <span
            className={`live-status ${douyinLive ? '' : 'live-status--unconfigured'}`}
            title={
              douyinLive
                ? liveBadgeState === 'unknown'
                  ? '状态未知（稍后自动刷新）'
                  : isLiveNow
                    ? liveTitle
                      ? `开播中：${liveTitle}`
                      : '开播中'
                    : '未开播'
                : '未配置直播间链接'
            }
          >
            {douyinLive && isLiveNow ? (
              <>
                <span className="live-status__text">开播中</span>
                <button
                  type="button"
                  className="live-status__btn"
                  aria-label="进入直播间"
                  title={liveTitle ? `进入直播间：${liveTitle}` : '进入直播间'}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(douyinLive, '_blank', 'noopener,noreferrer')
                  }}
                >
                  进入直播间
                </button>
              </>
            ) : (
              <span className="live-status__text live-status__text--off">
                {douyinLive ? (liveBadgeState === 'unknown' ? '检测中' : '未开播') : '未配置'}
              </span>
            )}
          </span>

          <span className="logo-text">小意OVO</span>
        </Link>

        <ul className="navbar-menu">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-time">
          <span className="time-text">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
