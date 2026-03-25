import { useState, useEffect } from 'react';
import { FiHeart, FiMail, FiVideo } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import dataManager from '../utils/dataManager';
import './About.css';

const About = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const adminData = dataManager.getData();
    setData(adminData);
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
