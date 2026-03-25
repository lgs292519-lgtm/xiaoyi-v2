import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave, FiUpload, FiMusic, FiMail, FiRadio, FiCalendar, FiClock, FiUser, FiInfo, FiMessageSquare } from 'react-icons/fi';
import dataManager from '../utils/dataManager';
import './AdminPanel.css';

const AdminPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('songs');
  const [data, setData] = useState({});
  const [songs, setSongs] = useState([]);
  const [newSong, setNewSong] = useState({ title: '', artist: '', genre: '国风仙侠' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [contact, setContact] = useState({});
  const [upcomingLives, setUpcomingLives] = useState([]);
  const [regularSchedule, setRegularSchedule] = useState([]);
  const [aboutIntro, setAboutIntro] = useState({});
  const [headerText, setHeaderText] = useState({});
  const [newLive, setNewLive] = useState({ title: '', date: '', time: '', platform: 'douyin' });
  const [newSchedule, setNewSchedule] = useState({ day: '', time: '', activity: '' });
  const [cottonMessages, setCottonMessages] = useState([]);

  useEffect(() => {
    const loadedData = dataManager.getData();
    setData(loadedData);
    setSongs(loadedData.songs || []);
    setContact(loadedData.contact || {});
    setUpcomingLives(loadedData.upcomingLives || []);
    setRegularSchedule(loadedData.regularSchedule || []);
    setAboutIntro(loadedData.aboutIntro || {});
    setHeaderText(loadedData.headerText || {});
    // 棉花糖留言从共享接口读取（所有设备可见）
    dataManager.getCottonCandyMessages().then((list) => {
      setCottonMessages(list || []);
    });
  }, []);

  const showSaveStatus = (message, isSuccess = true) => {
    setSaveStatus(isSuccess ? `✓ ${message}` : `✗ ${message}`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // 歌单管理
  const handleAddSong = () => {
    if (!newSong.title.trim()) {
      showSaveStatus('请输入歌曲名称', false);
      return;
    }
    const song = { ...newSong, id: Date.now() };
    const updatedSongs = [...songs, song];
    setSongs(updatedSongs);
    dataManager.saveData({ ...data, songs: updatedSongs });
    setNewSong({ title: '', artist: '', genre: '国风仙侠' });
    showSaveStatus('歌曲添加成功');
  };

  const handleDeleteSong = (id) => {
    const updatedSongs = songs.filter(s => s.id !== id);
    setSongs(updatedSongs);
    dataManager.saveData({ ...data, songs: updatedSongs });
    showSaveStatus('歌曲已删除');
  };

  const handleExportSongs = () => {
    const json = JSON.stringify(songs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'songs.json';
    a.click();
    URL.revokeObjectURL(url);
    showSaveStatus('歌单已导出');
  };

  // 头像上传
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showSaveStatus('图片大小不能超过2MB', false);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const avatarUrl = event.target.result;
        dataManager.updateAvatar(avatarUrl);
        setData(prev => ({ ...prev, avatarUrl }));
        showSaveStatus('头像上传成功');
      };
      reader.readAsDataURL(file);
    }
  };

  // 联系方式
  const handleSaveContact = () => {
    dataManager.updateContact(contact);
    showSaveStatus('联系方式已保存');
  };

  // 直播预告
  const handleAddLive = () => {
    if (!newLive.title.trim() || !newLive.date.trim()) {
      showSaveStatus('请填写完整信息', false);
      return;
    }
    const live = { ...newLive, id: Date.now(), status: '预告' };
    const updated = [...upcomingLives, live];
    setUpcomingLives(updated);
    dataManager.updateUpcomingLives(updated);
    setNewLive({ title: '', date: '', time: '', platform: 'douyin' });
    showSaveStatus('直播预告添加成功');
  };

  const handleDeleteLive = (id) => {
    const updated = upcomingLives.filter(l => l.id !== id);
    setUpcomingLives(updated);
    dataManager.updateUpcomingLives(updated);
    showSaveStatus('直播预告已删除');
  };

  // 固定直播安排
  const handleAddSchedule = () => {
    if (!newSchedule.day.trim() || !newSchedule.time.trim()) {
      showSaveStatus('请填写完整信息', false);
      return;
    }
    const item = { ...newSchedule, id: Date.now() };
    const updated = [...regularSchedule, item];
    setRegularSchedule(updated);
    dataManager.updateRegularSchedule(updated);
    setNewSchedule({ day: '', time: '', activity: '' });
    showSaveStatus('直播安排添加成功');
  };

  const handleDeleteSchedule = (id) => {
    const updated = regularSchedule.filter(s => s.id !== id);
    setRegularSchedule(updated);
    dataManager.updateRegularSchedule(updated);
    showSaveStatus('直播安排已删除');
  };

  // 关于介绍
  const handleSaveAbout = () => {
    dataManager.updateAboutIntro(aboutIntro);
    showSaveStatus('关于介绍已保存');
  };

  // 欢迎页文字
  const handleSaveHeader = () => {
    dataManager.updateHeaderText(headerText);
    showSaveStatus('欢迎页文字已保存');
  };

  const handleDeleteCottonMessage = async (id) => {
    const ok = await dataManager.deleteCottonCandyMessage(id);
    if (!ok) return;
    const list = await dataManager.getCottonCandyMessages();
    setCottonMessages(list || []);
    showSaveStatus('棉花糖留言已删除');
  };

  const handleClearCottonMessages = async () => {
    if (!window.confirm('确定要清空所有棉花糖留言吗？')) return;
    const ok = await dataManager.clearCottonCandyMessages();
    if (!ok) return;
    setCottonMessages([]);
    showSaveStatus('棉花糖留言已清空');
  };

  const tabs = [
    { id: 'songs', icon: <FiMusic />, label: '歌单管理' },
    { id: 'avatar', icon: <FiUser />, label: '头像上传' },
    { id: 'contact', icon: <FiMail />, label: '联系方式' },
    { id: 'lives', icon: <FiRadio />, label: '直播预告' },
    { id: 'schedule', icon: <FiCalendar />, label: '固定安排' },
    { id: 'cotton', icon: <FiMessageSquare />, label: '棉花糖留言' },
    { id: 'about', icon: <FiInfo />, label: '关于页面' },
  ];

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <h2>后台管理</h2>
          <button className="admin-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {saveStatus && <div className="save-status">{saveStatus}</div>}

        <div className="admin-content">
          <div className="admin-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-body">
            {/* 歌单管理 */}
            {activeTab === 'songs' && (
              <div className="tab-content">
                <h3>歌单管理</h3>
                <p className="section-hint">点击"导出歌单"下载当前歌单，点击"导入歌单"可上传新的歌曲列表</p>
                
                <div className="form-row">
                  <button className="btn-export" onClick={handleExportSongs}>
                    <FiUpload /> 导出歌单
                  </button>
                </div>

                <div className="add-form">
                  <h4>添加新歌曲</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="歌曲名称"
                      value={newSong.title}
                      onChange={e => setNewSong({ ...newSong, title: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="歌手（可选）"
                      value={newSong.artist}
                      onChange={e => setNewSong({ ...newSong, artist: e.target.value })}
                    />
                    <select
                      value={newSong.genre}
                      onChange={e => setNewSong({ ...newSong, genre: e.target.value })}
                    >
                      <option value="国风仙侠">国风仙侠</option>
                      <option value="治愈抒情">治愈抒情</option>
                      <option value="情绪共鸣">情绪共鸣</option>
                      <option value="甜系元气">甜系元气</option>
                    </select>
                    <button className="btn-add" onClick={handleAddSong}>
                      <FiPlus /> 添加
                    </button>
                  </div>
                </div>

                <div className="song-list">
                  <h4>当前歌单 ({songs.length} 首)</h4>
                  <div className="song-grid">
                    {songs.map(song => (
                      <div key={song.id} className="song-item">
                        <span className="song-title">{song.title}</span>
                        <span className="song-genre">{song.genre}</span>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteSong(song.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 头像上传 */}
            {activeTab === 'avatar' && (
              <div className="tab-content">
                <h3>头像上传</h3>
                <div className="avatar-preview">
                  {data.avatarUrl ? (
                    <img src={data.avatarUrl} alt="当前头像" />
                  ) : (
                    <img src="/images/avatar.jpg" alt="默认头像" />
                  )}
                </div>
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="btn-upload">
                    <FiUpload /> 选择图片
                  </label>
                  <p className="upload-hint">支持 JPG、PNG 格式，文件大小不超过 2MB</p>
                </div>
              </div>
            )}

            {/* 联系方式 */}
            {activeTab === 'contact' && (
              <div className="tab-content">
                <h3>联系方式</h3>
                <div className="form-group">
                  <label>抖音主页链接</label>
                  <input
                    type="url"
                    value={contact.douyinHome || ''}
                    onChange={e => setContact({ ...contact, douyinHome: e.target.value })}
                    placeholder="https://www.douyin.com/user/..."
                  />
                </div>
                <div className="form-group">
                  <label>抖音直播间链接</label>
                  <input
                    type="url"
                    value={contact.douyinLive || ''}
                    onChange={e => setContact({ ...contact, douyinLive: e.target.value })}
                    placeholder="https://live.douyin.com/..."
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={e => setContact({ ...contact, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                <button className="btn-save" onClick={handleSaveContact}>
                  <FiSave /> 保存联系方式
                </button>
              </div>
            )}

            {/* 直播预告 */}
            {activeTab === 'lives' && (
              <div className="tab-content">
                <h3>直播预告</h3>
                <div className="add-form">
                  <h4>添加新预告</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="直播标题"
                      value={newLive.title}
                      onChange={e => setNewLive({ ...newLive, title: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="日期（如：周六）"
                      value={newLive.date}
                      onChange={e => setNewLive({ ...newLive, date: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="时间（如：20:00）"
                      value={newLive.time}
                      onChange={e => setNewLive({ ...newLive, time: e.target.value })}
                    />
                    <button className="btn-add" onClick={handleAddLive}>
                      <FiPlus /> 添加
                    </button>
                  </div>
                </div>

                <div className="live-list">
                  <h4>当前预告</h4>
                  {upcomingLives.map(live => (
                    <div key={live.id} className="live-item">
                      <div className="live-info">
                        <span className="live-title">{live.title}</span>
                        <span className="live-meta">
                          <FiCalendar /> {live.date} <FiClock /> {live.time}
                        </span>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteLive(live.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 固定直播安排 */}
            {activeTab === 'schedule' && (
              <div className="tab-content">
                <h3>固定直播安排</h3>
                <div className="add-form">
                  <h4>添加新安排</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="星期（如：周三）"
                      value={newSchedule.day}
                      onChange={e => setNewSchedule({ ...newSchedule, day: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="时间（如：21:00 - 23:00）"
                      value={newSchedule.time}
                      onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="活动名称"
                      value={newSchedule.activity}
                      onChange={e => setNewSchedule({ ...newSchedule, activity: e.target.value })}
                    />
                    <button className="btn-add" onClick={handleAddSchedule}>
                      <FiPlus /> 添加
                    </button>
                  </div>
                </div>

                <div className="schedule-list">
                  <h4>当前安排</h4>
                  {regularSchedule.map(item => (
                    <div key={item.id} className="schedule-item">
                      <div className="schedule-info">
                        <span className="schedule-day">{item.day}</span>
                        <span className="schedule-time">{item.time}</span>
                        <span className="schedule-activity">{item.activity}</span>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteSchedule(item.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 关于页面 */}
            {activeTab === 'about' && (
              <div className="tab-content">
                <h3>关于页面设置</h3>
                
                <div className="form-group">
                  <label>欢迎页标题</label>
                  <input
                    type="text"
                    value={headerText.title || ''}
                    onChange={e => setHeaderText({ ...headerText, title: e.target.value })}
                    placeholder="欢迎来到 XIAOYI"
                  />
                </div>
                
                <div className="form-group">
                  <label>欢迎页副标题</label>
                  <input
                    type="text"
                    value={headerText.subtitle || ''}
                    onChange={e => setHeaderText({ ...headerText, subtitle: e.target.value })}
                    placeholder="点击任意处开始"
                  />
                </div>

                <button className="btn-save" onClick={handleSaveHeader}>
                  <FiSave /> 保存欢迎页设置
                </button>

                <div className="divider"></div>

                <div className="form-group">
                  <label>关于页面标题</label>
                  <input
                    type="text"
                    value={aboutIntro.title || ''}
                    onChange={e => setAboutIntro({ ...aboutIntro, title: e.target.value })}
                    placeholder="关于小意OVO"
                  />
                </div>
                
                <div className="form-group">
                  <label>关于页面内容（每行一段）</label>
                  <textarea
                    value={(aboutIntro.content || []).join('\n')}
                    onChange={e => setAboutIntro({ ...aboutIntro, content: e.target.value.split('\n') })}
                    placeholder="输入介绍内容..."
                    rows={6}
                  />
                </div>

                <div className="form-group">
                  <label>个人签名</label>
                  <input
                    type="text"
                    value={aboutIntro.tagline || ''}
                    onChange={e => setAboutIntro({ ...aboutIntro, tagline: e.target.value })}
                    placeholder="用歌声治愈每一颗心灵"
                  />
                </div>

                <button className="btn-save" onClick={handleSaveAbout}>
                  <FiSave /> 保存关于页面
                </button>
              </div>
            )}

            {/* 棉花糖留言管理 */}
            {activeTab === 'cotton' && (
                <div className="tab-content">
                <h3>棉花糖留言</h3>
                  <p className="section-hint">留言已改为共享存储：所有设备可见。</p>

                <div className="form-row">
                  <button className="btn-export" onClick={handleClearCottonMessages}>
                    <FiTrash2 /> 清空所有留言
                  </button>
                </div>

                <div className="live-list">
                  <h4>当前留言 ({(cottonMessages || []).length} 条)</h4>

                  {(cottonMessages || []).length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.55)' }}>暂无留言</p>
                  ) : (
                    (cottonMessages || []).map((m) => (
                      <div key={m.id} className="live-item">
                        <div className="live-info">
                          <span className="live-title">{m.nickname || '匿名'}</span>
                          <span className="live-meta" style={{ marginTop: '0.25rem' }}>
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.75)', marginTop: '0.35rem', lineHeight: 1.6 }}>
                            {m.content}
                          </span>
                        </div>

                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteCottonMessage(m.id)}
                          aria-label="删除留言"
                          title="删除留言"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
