import { useEffect, useState } from 'react';
import { FiHeart, FiLock, FiX } from 'react-icons/fi';
import './Footer.css';

const ADMIN_PASSWORD = 'xiaoyi2429';
const ADMIN_AUTH_KEY = 'xiaoyi_admin_authed_at'
const ADMIN_AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7天免密

const Footer = ({ onAdminClick }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false)

  const currentYear = new Date().getFullYear();

  // 进入页面就检查是否已验证过（避免每次都要输入密码）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_AUTH_KEY)
      const ts = raw ? Date.parse(raw) : null
      if (ts && Date.now() - ts < ADMIN_AUTH_TTL_MS) {
        setIsAuthed(true)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleMusicClick = () => {
    if (isAuthed) {
      onAdminClick()
      return
    }
    setShowPasswordModal(true);
    setPassword('');
    setError(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      setIsAuthed(true)
      try {
        localStorage.setItem(ADMIN_AUTH_KEY, new Date().toISOString())
      } catch {
        // ignore
      }
      onAdminClick();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  const handleClose = () => {
    setShowPasswordModal(false);
    setPassword('');
    setError(false);
  };

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>
              © {currentYear} 小意OVO · 用音乐治愈心灵
            </p>
            <div className="footer-links-row">
              <button className="footer-admin-btn" onClick={handleMusicClick}>
                <FiHeart /> Music
              </button>
              <p className="footer-heart">
                Made with <FiHeart /> and Music
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 密码弹窗 */}
      {showPasswordModal && (
        <div className="password-overlay" onClick={handleClose}>
          <div className="password-modal" onClick={e => e.stopPropagation()}>
            <button className="password-close" onClick={handleClose}>
              <FiX />
            </button>
            <div className="password-content">
              <div className="password-icon">
                <FiLock />
              </div>
              <h3>请输入管理员密码</h3>
              <p className="password-hint">输入密码以访问后台管理</p>
              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="请输入密码"
                  className={error ? 'error' : ''}
                  autoFocus
                />
                {error && <p className="error-text">密码错误，请重试</p>}
                <button type="submit" className="password-submit">
                  确认
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
