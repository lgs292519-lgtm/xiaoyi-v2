import { useState, useEffect } from 'react';
import { FiHeart, FiMail, FiVideo } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import dataManager from '../utils/dataManager';
import './About.css';

const DEFAULT_ABOUT_TAGS = [
  '社牛',
  '大胆',
  '可爱',
  '害羞',
  '精灵古怪',
  '天籁之音',
  '学歌超快',
  '神秘',
];

const ABOUT_VOTED_KEY = 'xiaoyi_about_tag_votes';

const About = () => {
  const [data, setData] = useState(null);
  const [fixedTags, setFixedTags] = useState([]);
  const [votedMap, setVotedMap] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [tagHint, setTagHint] = useState('');

  useEffect(() => {
    const refresh = () => setData(dataManager.getData());
    refresh();
    window.addEventListener('xiaoyi-avatar-updated', refresh);
    return () => window.removeEventListener('xiaoyi-avatar-updated', refresh);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ABOUT_VOTED_KEY);
      setVotedMap(raw ? JSON.parse(raw) : {});
    } catch {
      setVotedMap({});
    }

    // 获取固定标签 + 备用标签数据（固定标签会自动种子化）
    dataManager.getAboutTags().then(({ fixed } = {}) => {
      const list = Array.isArray(fixed) ? fixed : [];
      if (list.length) {
        setFixedTags(list);
      } else {
        setFixedTags(
          DEFAULT_ABOUT_TAGS.map((name, idx) => ({
            id: `default-${idx}`,
            name,
            likeCount: 0,
          }))
        );
      }
    });
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
              <p className="profile-tagline">{profileInfo.tagline || aboutIntro.tagline || '用歌声治愈每一颗心灵'}</p>
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

      {/* 标签互动 */}
      <section className="tag-section">
        <div className="container">
          <h2 className="subsection-title">个性标签</h2>
          <div className="tags-list">
            {fixedTags.map((tag) => {
              const isVoted = Boolean(votedMap[tag.id]);
              const handleToggleLike = async (e) => {
                // 点击标签本身/心心按钮都触发同一逻辑
                if (e?.stopPropagation) e.stopPropagation();

                const delta = isVoted ? -1 : 1;
                const prevMap = { ...votedMap };
                const isLocalOnly = String(tag.id).startsWith('default-');

                // 本地先更新，保证体验（失败会回滚）
                const nextMap = { ...votedMap };
                if (delta === 1) nextMap[tag.id] = true;
                else delete nextMap[tag.id];
                setVotedMap(nextMap);
                localStorage.setItem(ABOUT_VOTED_KEY, JSON.stringify(nextMap));

                // 默认标签：后端未连接时也允许点赞/取消
                if (isLocalOnly) {
                  setFixedTags((prev) =>
                    prev.map((t) =>
                      t.id === tag.id
                        ? { ...t, likeCount: Math.max(0, (t.likeCount ?? 0) + delta) }
                        : t
                    )
                  );
                  return;
                }

                try {
                  const updated = await dataManager.voteAboutTag(tag.id, delta);
                  if (updated?.likeCount !== undefined) {
                    setFixedTags((prev) =>
                      prev.map((t) => (t.id === tag.id ? { ...t, likeCount: updated.likeCount } : t))
                    );
                  } else {
                    // 接口失败回滚
                    setVotedMap(prevMap);
                    localStorage.setItem(ABOUT_VOTED_KEY, JSON.stringify(prevMap));
                  }
                } catch {
                  setVotedMap(prevMap);
                  localStorage.setItem(ABOUT_VOTED_KEY, JSON.stringify(prevMap));
                }
              };
              return (
                <div
                  key={tag.id}
                  className={`tag-item ${isVoted ? 'tag-item--voted' : ''}`}
                  onClick={handleToggleLike}
                >
                  <span className="tag-name">{tag.name}</span>
                  <button
                    type="button"
                    className="tag-like-btn"
                    aria-label={`${isVoted ? '取消点赞' : '点赞'} ${tag.name}`}
                    onClick={handleToggleLike}
                  >
                    <FiHeart className={`tag-like-icon ${isVoted ? 'tag-like-icon--voted' : ''}`} />
                    {tag.likeCount ?? 0}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="tag-suggest">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="给她的备用标签提名（管理员可加入固定标签）"
              maxLength={20}
            />
            <button
              type="button"
              className="tag-suggest-btn"
              onClick={async () => {
                const name = tagInput.trim();
                if (!name) return;
                const extra = await dataManager.suggestAboutTag(name);
                if (extra) {
                  setTagHint('已提交备用标签，期待管理员采纳。');
                  setTagInput('');
                } else {
                  setTagHint('提交失败，请稍后重试。');
                }
                setTimeout(() => setTagHint(''), 2500);
              }}
            >
              提交备用标签
            </button>
          </div>
          {tagHint ? <p className="tag-hint">{tagHint}</p> : null}
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
              <span className="contact-text">{contact.email || '请在棉花糖处留言'}</span>
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
