// 数据管理模块 - 使用 localStorage 持久化数据

const STORAGE_KEY = 'xiaoyi_admin_data';

// 默认数据
const defaultData = {
  contact: {
    douyinHome: 'https://www.douyin.com/user/MS4wLjABAAAApLv52fKEfQJaaUwamy-AXFsBwWFgARL7j9_bsv42RHp2ULyl7FokZXbd3oxb_Ewj',
    douyinLive: 'https://live.douyin.com/49330409995',
    email: ''
  },
  // 棉花糖留言（仅本地 localStorage 持久化）
  cottonCandy: {
    messages: []
  },
  // 即将直播（仅在“今天”时段内展示；可在管理界面手动添加覆盖自动标题）
  upcomingLives: [],
  regularSchedule: [
    // 每天三个固定时段：13-15 / 16-18 / 20-21（用于 Live 页随机掉落）
    // 需求：固定时段的“默认值”来自这里；之后可在管理界面替换/增删
    { id: 1, day: '每天', time: '13:00 - 15:00', activity: '小意出没，歌声相伴' },
    { id: 2, day: '每天', time: '16:00 - 18:00', activity: '小意出没，歌声相伴' },
    // 20-21 为随机池（管理端可继续增删活动名）
    { id: 3, day: '每天', time: '20:00 - 21:00', activity: '小意出没，歌声相伴' },
    { id: 4, day: '每天', time: '20:00 - 21:00', activity: '小意出没，歌声相伴' },
    { id: 5, day: '每天', time: '20:00 - 21:00', activity: '小意出没，歌声相伴' },
  ],
  aboutIntro: {
    title: '关于小意OVO',
    // 默认个人签名：后台可在管理界面“个人签名”维护
    tagline: '对的对的，别怕，天塌了我是顶天立地的人。',
    content: [
      '大家好，我是小意OVO。一个热爱音乐、热爱生活的普通人。',
      '从小就喜欢听歌、唱歌，音乐是我生活中不可或缺的一部分。',
      '希望用我的歌声，能够温暖每一个聆听者的心。',
      '这里是我的个人主页，收录了我喜欢的歌曲，也分享着我的音乐故事。',
      '如果某首歌刚好触动你的心弦，那就是我最开心的时刻。'
    ]
  },
  profileInfo: {
    tagline: '对的对的，别怕，天塌了我是顶天立地的人。',
    stats: {
      songs: '140+',
      love: '∞'
    }
  },
  headerText: {
    title: '欢迎来到 XIAOYI',
    subtitle: '点击任意处开始'
  }
};

// 获取所有数据
export const getData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 兼容旧数据：确保新字段存在
      const merged = {
        ...defaultData,
        ...parsed,
        cottonCandy: {
          ...(defaultData.cottonCandy || {}),
          ...(parsed.cottonCandy || {}),
        },
      };

      // 兼容旧默认内容：之前关于简介可能被替换成“签名句”，这里自动恢复到新默认段落
      const sig = '对的对的，别怕，天塌了我是顶天立地的人。';
      if (merged?.profileInfo?.tagline === '用歌声治愈每一颗心灵') {
        merged.profileInfo.tagline = defaultData.profileInfo.tagline;
      }
      if (
        Array.isArray(merged?.aboutIntro?.content) &&
        merged.aboutIntro.content.length === 1 &&
        String(merged.aboutIntro.content[0]).includes('天塌了我是顶天立地的人')
      ) {
        merged.aboutIntro.content = defaultData.aboutIntro.content;
      }

      // 确保关于页“个人签名”字段存在（兼容旧数据）
      if (!merged?.aboutIntro?.tagline || !String(merged.aboutIntro.tagline).trim()) {
        merged.aboutIntro.tagline = merged?.profileInfo?.tagline || defaultData.profileInfo.tagline;
      }

      // 按需求：旧邮箱默认不展示，避免“初始化时写过邮箱就一直显示”的问题
      if (merged?.contact?.email === 'yimaotongdianzi@163.com') {
        merged.contact.email = '';
      }

      return merged;
    }
    // 首次使用，初始化默认数据
    saveData(defaultData);
    return defaultData;
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultData;
  }
};

// 保存所有数据
export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // 通知同一页面其它模块（如 Live 页）立即刷新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xiaoyi-data-updated'))
    }
    // 跨设备同步：异步写入服务端（失败不影响本地体验）
    if (typeof fetch === 'function') {
      fetch(`${API_BASE}/api/admin-data`, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ data }),
      }).catch(() => {})
    }
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
};

// 从服务端同步管理数据到本地（跨设备拉取）
export const syncAdminDataFromServer = async () => {
  if (typeof fetch !== 'function') return false
  try {
    const res = await fetch(`${API_BASE}/api/admin-data`, { method: 'GET' })
    if (!res.ok) return false
    const payload = await res.json().catch(() => ({}))
    const serverData = payload?.data
    if (!serverData) return false

    // 只写本地，不触发 saveData 的 POST，避免写回死循环
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData))
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
    return true
  } catch {
    return false
  }
}

// 更新联系方式
export const updateContact = (contact) => {
  const data = getData();
  data.contact = { ...data.contact, ...contact };
  return saveData(data);
};

// 更新即将直播
export const updateUpcomingLives = (lives) => {
  const data = getData();
  data.upcomingLives = lives;
  return saveData(data);
};

// 添加直播预告
export const addUpcomingLive = (live) => {
  const data = getData();
  const newLive = {
    id: Date.now(),
    ...live,
    status: live.status || '预告'
  };
  data.upcomingLives.push(newLive);
  return saveData(data);
};

// 删除直播预告
export const deleteUpcomingLive = (id) => {
  const data = getData();
  data.upcomingLives = data.upcomingLives.filter(live => live.id !== id);
  return saveData(data);
};

// 更新固定直播安排
export const updateRegularSchedule = (schedule) => {
  const data = getData();
  data.regularSchedule = schedule;
  return saveData(data);
};

// 添加固定直播安排
export const addRegularSchedule = (item) => {
  const data = getData();
  const newItem = {
    id: Date.now(),
    ...item
  };
  data.regularSchedule.push(newItem);
  return saveData(data);
};

// 删除固定直播安排
export const deleteRegularSchedule = (id) => {
  const data = getData();
  data.regularSchedule = data.regularSchedule.filter(item => item.id !== id);
  return saveData(data);
};

// 更新头像
export const updateAvatar = (avatarUrl) => {
  const data = getData();
  data.avatarUrl = avatarUrl;
  return saveData(data);
};

// 更新关于介绍
export const updateAboutIntro = (intro) => {
  const data = getData();
  data.aboutIntro = { ...data.aboutIntro, ...intro };
  return saveData(data);
};

// 更新个人资料信息
export const updateProfileInfo = (info) => {
  const data = getData();
  data.profileInfo = { ...data.profileInfo, ...info };
  return saveData(data);
};

// 更新欢迎页文字
export const updateHeaderText = (text) => {
  const data = getData();
  data.headerText = { ...data.headerText, ...text };
  return saveData(data);
};

// ===== 棉花糖留言 =====
// 所有设备共享：通过 Cloudflare Pages Functions 接口读写
// GET    /api/cotton-candy
// POST   /api/cotton-candy          { nickname, content }
// DELETE /api/cotton-candy (json)  { id }
// POST   /api/cotton-candy/clear
const API_BASE = '' // 同域调用（/pages.dev / 自定义域都适配）

const COTTON_USER_KEY_STORAGE = 'xiaoyi_cotton_user_key'
const getCottonUserKey = () => {
  try {
    const existing = localStorage.getItem(COTTON_USER_KEY_STORAGE)
    if (existing) return existing
    const v = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem(COTTON_USER_KEY_STORAGE, v)
    return v
  } catch {
    // 兜底：如果 localStorage 不可用，就退化为一次性 key（仅影响“只能删自己的”能力）
    return `temp-${Date.now()}`
  }
}

export const getCottonCandyMessages = async () => {
  const res = await fetch(`${API_BASE}/api/cotton-candy`, { method: 'GET' })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return data.messages || []
}

export const addCottonCandyMessage = async ({ nickname, content }) => {
  const authorKey = getCottonUserKey()
  const res = await fetch(`${API_BASE}/api/cotton-candy`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ nickname, content, authorKey }),
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return data?.ok === true
}

export const deleteCottonCandyMessage = async (id) => {
  const authorKey = getCottonUserKey()
  const res = await fetch(`${API_BASE}/api/cotton-candy`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ id, authorKey }),
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return data?.ok === true
}

export const clearCottonCandyMessages = async () => {
  const res = await fetch(`${API_BASE}/api/cotton-candy/clear`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return data?.ok === true
}

// ===== 关于标签（固定标签 + 备用标签）=====
// 说明：
// - 粉丝可对“固定标签”点赞
// - 粉丝可提交“备用标签”提名
// - 管理员可把“备用标签”提升为“固定标签”
export const getAboutTags = async () => {
  const res = await fetch(`${API_BASE}/api/about-tags`, { method: 'GET' })
  if (!res.ok) return { fixed: [], extras: [] }
  const data = await res.json().catch(() => ({}))
  return {
    fixed: data.fixed || [],
    extras: data.extras || [],
  }
}

export const voteAboutTag = async (tagId, delta = 1) => {
  const res = await fetch(`${API_BASE}/api/about-tags/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ tagId, delta }),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data?.tag || null
}

// 备用标签点赞（达到 >=3 自动升级为固定标签）
export const voteAboutExtraTag = async (extraId, delta = 1) => {
  const res = await fetch(`${API_BASE}/api/about-tags/extra-vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ extraId, delta }),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data || null
}

export const suggestAboutTag = async (name) => {
  const res = await fetch(`${API_BASE}/api/about-tags`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data?.extra || null
}

export const promoteAboutExtraTag = async (extraId) => {
  const res = await fetch(`${API_BASE}/api/about-tags/promote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ extraId }),
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return data?.ok === true
}

// 重置为默认数据
export const resetData = () => {
  saveData(defaultData);
  return defaultData;
};

export default {
  getData,
  saveData,
  updateContact,
  updateUpcomingLives,
  addUpcomingLive,
  deleteUpcomingLive,
  updateRegularSchedule,
  addRegularSchedule,
  deleteRegularSchedule,
  updateAvatar,
  updateAboutIntro,
  updateProfileInfo,
  updateHeaderText,
  getCottonCandyMessages,
  addCottonCandyMessage,
  deleteCottonCandyMessage,
  clearCottonCandyMessages,
  getAboutTags,
  voteAboutTag,
  voteAboutExtraTag,
  suggestAboutTag,
  promoteAboutExtraTag,
  syncAdminDataFromServer,
  resetData
};
