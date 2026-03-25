import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMusic, FiShoppingBag, FiRadio, FiUser, FiMessageSquare } from 'react-icons/fi'
import dataManager from '../utils/dataManager'
import './Navbar.css'

const AVATAR_SRC = '/images/avatar.jpg'

const WEEKDAY_TO_CN = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
}

function parseHHmmToMinutes(s) {
  const m = String(s || '').match(/^(\d{2}):(\d{2})$/)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
  return hh * 60 + mm
}

function computeIsLive(regularSchedule = []) {
  const now = new Date()
  const currentDay = WEEKDAY_TO_CN[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (const item of regularSchedule || []) {
    if (!item) continue
    if (item.day !== currentDay) continue

    // 例如： "21:00 - 23:00"
    const m = String(item.time || '').match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
    if (!m) continue

    const start = parseHHmmToMinutes(m[1])
    const end = parseHHmmToMinutes(m[2])
    if (start === null || end === null) continue

    if (nowMinutes >= start && nowMinutes <= end) return true
  }

  return false
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_SRC)
  const [douyinLive, setDouyinLive] = useState('')
  const [regularSchedule, setRegularSchedule] = useState([])
  const [isLiveNow, setIsLiveNow] = useState(false)
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
    const schedule = data?.regularSchedule || []
    setRegularSchedule(schedule)

    const tick = () => {
      setIsLiveNow(computeIsLive(schedule))
    }

    tick()
    // 每分钟更新一次，避免太频繁
    const t = setInterval(tick, 60_000)
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
              <img
                src={avatarUrl}
                alt="小意OVO"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="logo-fallback">意</span>
            )}
            {douyinLive && isLiveNow ? (
              <a
                href={douyinLive}
                target="_blank"
                rel="noopener noreferrer"
                className="live-badge live-badge--link"
                aria-label="开播中，点击进入直播间"
                title="开播中，点击进入直播间"
              >
                开播
              </a>
            ) : (
              <span
                className={`live-badge ${douyinLive ? 'live-badge--off' : ''}`}
                title={douyinLive ? '未开播' : '未配置直播间链接'}
              >
                未开播
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
