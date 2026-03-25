// 数据管理模块 - 使用 localStorage 持久化数据

const STORAGE_KEY = 'xiaoyi_admin_data';

// 默认数据
const defaultData = {
  contact: {
    douyinHome: 'https://www.douyin.com/user/MS4wLjABAAAApLv52fKEfQJaaUwamy-AXFsBwWFgARL7j9_bsv42RHp2ULyl7FokZXbd3oxb_Ewj',
    douyinLive: 'https://live.douyin.com/49330409995',
    email: 'yimaotongdianzi@163.com'
  },
  // 棉花糖留言（仅本地 localStorage 持久化）
  cottonCandy: {
    messages: []
  },
  // 即将直播（仅在“今天”时段内展示；可在管理界面手动添加覆盖自动标题）
  upcomingLives: [],
  regularSchedule: [
    // 每天三个固定时段：13-15 / 16-18 / 20-21（用于 Live 页随机掉落）
    { id: 1, day: '每天', time: '13:00 - 15:00', activity: '午后歌声相伴' },
    { id: 2, day: '每天', time: '13:00 - 15:00', activity: '咖啡与旋律' },
    { id: 3, day: '每天', time: '13:00 - 15:00', activity: '阳光小调' },
    { id: 4, day: '每天', time: '16:00 - 18:00', activity: '傍晚治愈电台' },
    { id: 5, day: '每天', time: '16:00 - 18:00', activity: '暖风耳语' },
    { id: 6, day: '每天', time: '16:00 - 18:00', activity: '晚霞合唱' },
    { id: 7, day: '每天', time: '20:00 - 21:00', activity: '晚间心动专场' },
    { id: 8, day: '每天', time: '20:00 - 21:00', activity: '星光点歌夜' },
    { id: 9, day: '每天', time: '20:00 - 21:00', activity: '月色合奏' },
  ],
  aboutIntro: {
    title: '关于小意OVO',
    content: [
      '对的对的，别怕，天塌了我是顶天立地的人。'
    ]
  },
  profileInfo: {
    tagline: '用歌声治愈每一颗心灵',
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
      return {
        ...defaultData,
        ...parsed,
        cottonCandy: {
          ...(defaultData.cottonCandy || {}),
          ...(parsed.cottonCandy || {}),
        },
      };
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
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
};

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

export const getCottonCandyMessages = async () => {
  const res = await fetch(`${API_BASE}/api/cotton-candy`, { method: 'GET' })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return data.messages || []
}

export const addCottonCandyMessage = async ({ nickname, content }) => {
  const res = await fetch(`${API_BASE}/api/cotton-candy`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ nickname, content }),
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return data?.ok === true
}

export const deleteCottonCandyMessage = async (id) => {
  const res = await fetch(`${API_BASE}/api/cotton-candy`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ id }),
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

export const voteAboutTag = async (tagId) => {
  const res = await fetch(`${API_BASE}/api/about-tags/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ tagId }),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data?.tag || null
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
  suggestAboutTag,
  promoteAboutExtraTag,
  resetData
};
