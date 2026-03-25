import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMusic, FiShoppingBag, FiRadio, FiUser } from 'react-icons/fi'
import './Navbar.css'

const AVATAR_SRC = '/images/avatar.jpg'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { path: '/', label: '首页', icon: <FiUser /> },
    { path: '/playlist', label: '歌单', icon: <FiMusic /> },
    { path: '/goods', label: '周边', icon: <FiShoppingBag /> },
    { path: '/live', label: '直播', icon: <FiRadio /> },
    { path: '/about', label: '关于', icon: <FiUser /> },
  ]

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-avatar">
            {!avatarError ? (
              <img
                src={AVATAR_SRC}
                alt="小意OVO"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="logo-fallback">意</span>
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
