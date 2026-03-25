import { useState, useEffect } from 'react';
import { FiHeart, FiMail, FiVideo } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import dataManager from '../utils/dataManager';
import './About.css';

const About = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const refresh = () => setData(dataManager.getData());
    refresh();
    window.addEventListener('xiaoyi-avatar-updated', refresh);
    return () => window.removeEventListener('xiaoyi-avatar-updated', refresh);
  }, []);

  if (!data) {
    return <div className="about-page"><div className="container">加载中...</div></div>;
  }

  const contact = data.contact || {};
  const aboutIntro = data.aboutIntro || {};
  const profileInfo = data.profileInfo || {};
  const avatarUrl = data.avatarUrl || '/images/avatar.jpg';
  const recordingUrl = 'https://www.alipan.com/s/Z46yB47C7F7';

  const contentParagraphs = Array.isArray(aboutIntro.content) 
    ? aboutIntro.content 
    : [];

  return (
    <div className="about-page">
      <section className="about-header">
        <div className="container">
          <div className="profile-section">
            <div className="profile-avatar">
              <img src={avatarUrl} alt="小意OVO" />
            </div>
            <div className="profile-info">
              <h1>小意OVO</h1>
              <p className="profile-tagline">{profileInfo.tagline || '用歌声治愈每一颗心灵'}</p>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{profileInfo.stats?.songs || '140+'}</span>
                  <span className="stat-label">收录歌曲</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{profileInfo.stats?.love || '∞'}</span>
                  <span className="stat-label">热爱音乐</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-intro">
        <div className="container">
          <div className="intro-card">
            <h2>{aboutIntro.title || '关于小意OVO'}</h2>
            {contentParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <h2 className="subsection-title">关注我</h2>
          <div className="contact-cards">
            <a href={contact.douyinHome || '#'} target="_blank" rel="noopener noreferrer" className="contact-card douyin-card">
              <div className="contact-item">
                <span className="contact-icon"><FaTiktok /></span>
                <span className="contact-text">抖音主页</span>
              </div>
            </a>
            <a href={contact.douyinLive || '#'} target="_blank" rel="noopener noreferrer" className="contact-card douyin-card">
              <div className="contact-item">
                <span className="contact-icon"><FaTiktok /></span>
                <span className="contact-text">抖音直播间</span>
              </div>
            </a>
            <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="contact-card recording-card">
              <div className="contact-item">
                <span className="contact-icon"><FiVideo /></span>
                <span className="contact-text">录屏回放</span>
              </div>
            </a>
          </div>
          <div className="contact-card email-card">
            <div className="contact-item">
              <span className="contact-icon"><FiMail /></span>
              <span className="contact-text">{contact.email || 'yimaotongdianzi@163.com'}</span>
            </div>
          </div>
          <p className="contact-hint">商务合作、粉丝群等问题可通过邮箱联系（非本人）</p>
        </div>
      </section>

      <section className="update-log-section">
        <div className="container">
          <h2 className="subsection-title">更新日志</h2>
          <div className="update-log-card">
            <div className="update-log-date">2026-03-25</div>
            <ul className="update-log-list">
              <li>新增“棉花糖留言”（共享存储，所有设备可见），后台可清空/删除留言</li>
              <li>手机端歌单体验优化：分类横滑、歌名两列卡片显示、内容不被底栏遮挡</li>
              <li>实时开播状态：头像旁显示开播中/未开播，开播中可直接跳转直播间</li>
              <li>头像自动同步：开播状态接口返回 `avatar_url` 后，关于页头像将自动更新</li>
              <li>关于页新增录屏回放入口</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="thanks-section">
        <div className="container">
          <div className="thanks-content">
            <h2>感谢每一个聆听的你</h2>
            <p>
              <FiHeart className="heart-icon" />
              愿音乐能跨越时空，连接每一颗热爱生活的心
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
