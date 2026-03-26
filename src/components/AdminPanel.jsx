import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave, FiUpload, FiMusic, FiMail, FiRadio, FiCalendar, FiClock, FiUser, FiInfo, FiMessageSquare, FiHeart } from 'react-icons/fi';
import dataManager from '../utils/dataManager';
import './AdminPanel.css';

const AdminPanel = ({ onClose }) => {
  const ADMIN_PASSWORD = 'xiaoyi2429'
  const ADMIN_AUTH_KEY = 'xiaoyi_admin_authed_at'
  const ADMIN_AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7天免密

  const WEEKDAY_TO_CN = {
    0: '周日',
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
  }

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
  const [newExtraTagName, setNewExtraTagName] = useState('');
  const [newLive, setNewLive] = useState(() => {
    const t = new Date()
    const dateISO = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    return {
      title: '',
      dateISO,
      startTime: '10:00',
      endTime: '12:00',
      platform: 'douyin',
      liveType: '固定',
    }
  })
  const [newSchedule, setNewSchedule] = useState({ day: '', time: '', activity: '', liveType: '固定' });
  const [cottonMessages, setCottonMessages] = useState([]);
  const [aboutFixedTags, setAboutFixedTags] = useState([]);
  const [aboutExtraTags, setAboutExtraTags] = useState([]);

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

    // 关于标签（共享接口：固定标签可点赞、备用标签可被管理员加入固定）
    dataManager.getAboutTags().then(({ fixed, extras } = {}) => {
      setAboutFixedTags(Array.isArray(fixed) ? fixed : []);
      setAboutExtraTags(Array.isArray(extras) ? extras : []);
    });
  }, []);

  function clampInt(n, { min, max, fallback }) {
    const v = Number.parseInt(String(n ?? ''), 10)
    if (!Number.isFinite(v)) return fallback
    return Math.min(max, Math.max(min, v))
  }

  function formatISODate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function getNowMinutes(d = new Date()) {
    return d.getHours() * 60 + d.getMinutes()
  }

  function hashToInt(str) {
    // Simple deterministic hash (non-crypto)
    let h = 5381
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
    return h >>> 0
  }

  function selectDeterministic(arr, seedStr) {
    const list = Array.isArray(arr) ? arr.filter(Boolean) : []
    if (list.length === 0) return ''
    const idx = hashToInt(seedStr) % list.length
    return list[idx]
  }

  function parseTimeRangeToSlot(timeStr) {
    const raw = String(timeStr ?? '').trim()
    if (!raw) return null
    // 兼容：全角/半角分隔符、中文“点/至”等写法
    const s = raw
      .replace(/\s/g, '')
      .replace(/点/g, '')
      .replace(/：/g, ':')
      .replace(/[－–—]/g, '-')
      .replace(/至/g, '-')
      .replace(/~/g, '-')

    const m1 = s.match(/^(\d{1,2})(?::[0]*0)?-(\d{1,2})(?::[0]*0)?$/)
    const m2 = !m1 ? s.match(/^(\d{1,2})-(\d{1,2})$/) : null
    const m = m1 || m2
    if (!m) return null

    const startHour = Number(m[1])
    const endHour = Number(m[2])
    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) return null
    if (startHour < 0 || startHour > 24) return null
    if (endHour < 0 || endHour > 24) return null

    const startMin = startHour * 60
    const endMin = endHour * 60
    const slotKey = `${startHour}-${endHour}`
    const slotZh = `${startHour}-${endHour}点`
    const timeRangeDisplay = `${startHour}：00-${endHour}：00`

    let liveType = '固定'
    // 默认：21-22 点随机（兼容旧配置：20-21 点也当作随机）
    if (slotKey === '21-22' || slotKey === '20-21') liveType = '随机'

    return { slotKey, startHour, endHour, startMin, endMin, slotZh, timeRangeDisplay, liveType }
  }

  function deriveLiveTypeFromTime(timeStr) {
    const parsed = parseTimeRangeToSlot(timeStr)
    return parsed?.liveType || '固定'
  }

  function parseHourFromTime(timeStr) {
    const m = String(timeStr ?? '').match(/(\d{1,2})/)
    if (!m) return null
    const hh = Number(m[1])
    if (!Number.isFinite(hh)) return null
    return clampInt(hh, { min: 0, max: 23, fallback: null })
  }

  function parseISODateParts(dateISO) {
    const m = String(dateISO ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return null
    const y = Number(m[1])
    const mo = Number(m[2])
    const day = Number(m[3])
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(day)) return null
    return { y, mo, day }
  }

  function parseLocalDateTime(dateISO, timeHHMM) {
    const dateParts = parseISODateParts(dateISO)
    if (!dateParts) return null
    const t = String(timeHHMM ?? '').trim().match(/^(\d{1,2}):(\d{2})$/)
    if (!t) return null
    const hh = Number(t[1])
    const mm = Number(t[2])
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
    const dt = new Date(dateParts.y, dateParts.mo - 1, dateParts.day, hh, mm, 0, 0)
    const ms = dt.getTime()
    if (!Number.isFinite(ms)) return null
    return ms
  }

  function formatDateLabel(dateISO) {
    const parts = parseISODateParts(dateISO)
    if (!parts) return String(dateISO ?? '')
    const now = new Date()
    if (
      now.getFullYear() === parts.y &&
      now.getMonth() + 1 === parts.mo &&
      now.getDate() === parts.day
    ) {
      return '今天'
    }
    return `${parts.mo}月${parts.day}日`
  }

  function formatTimeRangeDisplay(startTime, endTime) {
    const s = String(startTime ?? '').trim().match(/^(\d{1,2}):(\d{2})$/)
    const e = String(endTime ?? '').trim().match(/^(\d{1,2}):(\d{2})$/)
    if (!s || !e) return ''
    const sh = String(Number(s[1])).padStart(2, '0')
    const sm = s[2]
    const eh = String(Number(e[1])).padStart(2, '0')
    const em = e[2]
    return `${sh}：${sm}-${eh}：${em}`
  }

  const showSaveStatus = (message, isSuccess = true) => {
    setSaveStatus(isSuccess ? `✓ ${message}` : `✗ ${message}`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // 重置：清空本地配置，恢复到代码里的默认数据
  const handleResetToDefault = async () => {
    const ok = window.confirm('确定要重置为默认数据吗？这会清空当前浏览器的本地配置。');
    if (!ok) return;

    dataManager.resetData();

    // 重新读取并更新管理面板状态（避免需要手动刷新页面）
    const fresh = dataManager.getData();
    setData(fresh);
    setSongs(fresh.songs || []);
    setContact(fresh.contact || {});
    setUpcomingLives(fresh.upcomingLives || []);
    setRegularSchedule(fresh.regularSchedule || []);
    setAboutIntro(fresh.aboutIntro || {});
    setHeaderText(fresh.headerText || {});

    // 标签数据在 D1 中，需要重新拉取一次，才能在“删除后重置”时恢复默认固定标签
    try {
      const res = await dataManager.getAboutTags()
      setAboutFixedTags(res?.fixed || [])
      setAboutExtraTags(res?.extras || [])
    } catch {
      // 忽略：不影响其它本地数据重置
    }

    showSaveStatus('已重置为默认数据');
    // 标签在 D1 中，不属于 localStorage，因此重置时也需要一并恢复默认标签
    try {
      const okTags = await dataManager.resetAboutTagsToDefault({ adminPass: ADMIN_PASSWORD })
      if (okTags) {
        const res2 = await dataManager.getAboutTags()
        setAboutFixedTags(res2?.fixed || [])
        setAboutExtraTags(res2?.extras || [])
      }
    } catch {
      // 忽略标签重置失败：不影响其它本地数据重置
    }
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
  };

  // 歌单管理
  const handleAddSong = () => {
    if (!newSong.title.trim()) {
      showSaveStatus('请输入歌曲名称', false);
      return;
    }
    // Date.now 在短时间内可能冲突，使用额外随机数确保唯一
    const song = {
      ...newSong,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
    const updatedSongs = [...songs, song];
    setSongs(updatedSongs);
    dataManager.saveData({ ...data, songs: updatedSongs });
    setNewSong({ title: '', artist: '', genre: '国风仙侠' });
    showSaveStatus('歌曲添加成功');
  };

  const handleDeleteSong = (songIndex) => {
    const idx = Number.parseInt(String(songIndex ?? ''), 10);
    if (!Number.isFinite(idx)) return;
    const updatedSongs = songs.filter((_, i) => i !== idx);
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
    if (!newLive.title.trim() || !String(newLive.dateISO ?? '').trim() || !String(newLive.startTime ?? '').trim() || !String(newLive.endTime ?? '').trim()) {
      showSaveStatus('请填写完整信息', false);
      return;
    }

    const timeRangeDisplay = formatTimeRangeDisplay(newLive.startTime, newLive.endTime)
    const liveDateLabel = formatDateLabel(newLive.dateISO)

    // time 字段用于兼容旧逻辑（只取起始小时）；startTime/endTime 用于前端渲染任意时间预告
    const live = {
      id: Date.now(),
      title: newLive.title,
      dateISO: newLive.dateISO,
      date: liveDateLabel,
      startTime: newLive.startTime,
      endTime: newLive.endTime,
      time: `${newLive.startTime}-${newLive.endTime}`,
      timeRangeDisplay,
      platform: newLive.platform || 'douyin',
      liveType: newLive.liveType || '固定',
      status: '预告',
    }
    const updated = [...upcomingLives, live];
    setUpcomingLives(updated);
    dataManager.updateUpcomingLives(updated);
    setNewLive((prev) => ({
      ...prev,
      title: '',
      liveType: prev.liveType || '固定',
      startTime: prev.startTime || '10:00',
      endTime: prev.endTime || '12:00',
    }))
    showSaveStatus('直播预告添加成功');
  };

  const handleDeleteLive = (id) => {
    // 删除自动生成项：写入已隐藏记录，而不是物理删除
    const updated = upcomingLives.map((l) => (l.id === id ? { ...l, status: '已隐藏' } : l))
    setUpcomingLives(updated)
    dataManager.updateUpcomingLives(updated)
    showSaveStatus('直播预告已隐藏');
  };

  const handleHideLiveByGenerated = (generated) => {
    const next = [
      ...upcomingLives,
      {
        id: Date.now(),
        title: '',
        date: generated.date,
        time: generated.time,
        platform: generated.platform || 'douyin',
        liveType: generated.liveType || '固定',
        status: '已隐藏',
      },
    ]
    setUpcomingLives(next)
    dataManager.updateUpcomingLives(next)
    showSaveStatus('直播预告已隐藏')
  }

  const handleEditLiveTitle = (entry) => {
    const nextTitle = window.prompt('修改直播预告标题：', entry.title || '')
    if (!nextTitle) return

    // 对生成项：新增一条覆盖记录；对手动项：直接更新
    if (entry._manualId) {
      const updated = upcomingLives.map((l) => (l.id === entry._manualId ? { ...l, title: nextTitle, status: '预告' } : l))
      setUpcomingLives(updated)
      dataManager.updateUpcomingLives(updated)
      showSaveStatus('直播预告已更新')
      return
    }

    const next = [
      ...upcomingLives,
      {
        id: Date.now(),
        title: nextTitle,
        date: entry.date,
        time: entry.time,
        platform: entry.platform || 'douyin',
        liveType: entry.liveType || '固定',
        status: '预告',
      },
    ]
    setUpcomingLives(next)
    dataManager.updateUpcomingLives(next)
    showSaveStatus('直播预告已更新')
  }

  const todayNow = new Date()
  const todayISO = formatISODate(todayNow)
  const todayCN = WEEKDAY_TO_CN[todayNow.getDay()]
  const nowMinutes = getNowMinutes(todayNow)

  // 即将直播：从固定安排（regularSchedule）自动生成，并与后台手动修改/隐藏合并
  const mergedUpcomingLivesForAdmin = (() => {
    const regularScheduleSafe = Array.isArray(regularSchedule) ? regularSchedule : []
    const scheduleEntriesBySlotKey = new Map() // slotKey -> { parsedSlot, entries }

    for (const item of regularScheduleSafe) {
      if (!item) continue
      const parsed = parseTimeRangeToSlot(item?.time)
      if (!parsed) continue
      const key = parsed.slotKey
      if (!scheduleEntriesBySlotKey.has(key)) {
        scheduleEntriesBySlotKey.set(key, { parsedSlot: parsed, entries: [] })
      }
      scheduleEntriesBySlotKey.get(key).entries.push(item)
    }

    const generatedSlots = []
    for (const [, value] of scheduleEntriesBySlotKey.entries()) {
      const { parsedSlot, entries } = value
      const slotPoolDaily = entries.filter((e) => {
        const day = String(e?.day ?? '')
        return !day || day === '每天' || day === todayCN
      })
      const poolSource = slotPoolDaily.length ? slotPoolDaily : entries
      const pool = poolSource.map((e) => String(e?.activity ?? '').trim()).filter((t) => t && t !== '未配置活动')
      if (!pool.length) continue

      const liveTypeFromItems = entries.find((e) => e?.liveType === '固定' || e?.liveType === '随机')?.liveType
      const liveType = liveTypeFromItems || parsedSlot.liveType
      const seedStr = liveType === '随机' ? `${todayISO}-${parsedSlot.slotKey}` : `${parsedSlot.slotKey}-fixed`
      const title = selectDeterministic(pool, seedStr)

      if (nowMinutes >= parsedSlot.startMin) continue

      generatedSlots.push({
        slotKey: parsedSlot.slotKey,
        startHour: parsedSlot.startHour,
        date: todayCN,
        time: parsedSlot.slotZh,
        timeRangeDisplay: parsedSlot.timeRangeDisplay,
        platform: 'douyin',
        liveType,
        title,
        status: '预告',
        _startMin: parsedSlot.startMin,
      })
    }

    generatedSlots.sort((a, b) => a._startMin - b._startMin)
    const slotByStartHour = new Map(generatedSlots.map((s) => [s.startHour, s]))

    // 手动项：根据时间映射到固定时段 slot
    const manualBySlotKey = new Map() // slotKey -> manual live (latest by id)
    for (const m of upcomingLives || []) {
      if (!m) continue
      const hour = parseHourFromTime(m.time)
      if (hour === null) continue
      const slot = slotByStartHour.get(hour)
      if (!slot) continue

      const cur = manualBySlotKey.get(slot.slotKey)
      if (!cur || Number(m.id ?? 0) > Number(cur.id ?? 0)) {
        manualBySlotKey.set(slot.slotKey, m)
      }
    }

    // 合并：已隐藏 => 不展示；预告 => 覆盖标题/内容
    const merged = []
    for (const g of generatedSlots) {
      const manual = manualBySlotKey.get(g.slotKey)
      if (manual && manual.status === '已隐藏') continue
      if (manual) {
        merged.push({
          ...g,
          id: manual.id,
          _manualId: manual.id,
          title: manual.title || g.title,
          date: manual.date || g.date,
          time: manual.time || g.time,
          platform: manual.platform || g.platform,
          liveType: manual.liveType || g.liveType,
          status: manual.status || g.status,
        })
      } else {
        merged.push({
          ...g,
          id: `gen-${g.slotKey}-${todayISO}`,
          _manualId: null,
        })
      }
    }

    // 额外的“任意时间预告”：只要 dateISO + startTime/endTime 且时间未过去就展示
    const manualExtras = (upcomingLives || [])
      .filter((m) => m && m.status !== '已隐藏' && m.dateISO && m.startTime && m.endTime)
      .map((m) => {
        const startAtMs = parseLocalDateTime(m.dateISO, m.startTime)
        if (startAtMs === null || startAtMs <= Date.now()) return null

        return {
          ...m,
          id: m.id,
          _manualId: m.id,
          date: m.date || formatDateLabel(m.dateISO),
          time: m.time || `${m.startTime}-${m.endTime}`,
          liveType: m.liveType || '固定',
          status: '预告',
        }
      })
      .filter(Boolean)

    return [...merged, ...manualExtras]
  })()

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
    setNewSchedule({ day: '', time: '', activity: '', liveType: '固定' });
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

  const isAdminAuthed = () => {
    try {
      const raw = localStorage.getItem(ADMIN_AUTH_KEY)
      const ts = raw ? Date.parse(raw) : NaN
      return Number.isFinite(ts) && Date.now() - ts < ADMIN_AUTH_TTL_MS
    } catch {
      return false
    }
  }

  const handleDeleteCottonMessage = async (id) => {
    const ok = await dataManager.deleteCottonCandyMessage(id, isAdminAuthed() ? { adminPass: ADMIN_PASSWORD } : {})
    if (!ok) {
      showSaveStatus('删除失败（请确认管理员权限）', false);
      return;
    }
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
    { id: 'about-tags', icon: <FiHeart />, label: '关于标签' },
    { id: 'about', icon: <FiInfo />, label: '关于页面' },
  ];

  const handlePromoteExtraTag = async (extraId) => {
    const ok = await dataManager.promoteAboutExtraTag(extraId);
    if (!ok) return;
    const res = await dataManager.getAboutTags();
    setAboutFixedTags(res?.fixed || []);
    setAboutExtraTags(res?.extras || []);
    showSaveStatus('已加入固定标签');
  };

  const refreshAboutTagsForAdmin = async () => {
    const res = await dataManager.getAboutTags()
    setAboutFixedTags(res?.fixed || [])
    setAboutExtraTags(res?.extras || [])
  }

  const handleEditFixedTag = async (tag) => {
    if (!tag?.id) return
    const nextName = window.prompt('编辑固定标签名称：', tag.name || '')
    if (!nextName) return
    const ok = await dataManager.editAboutTagName(
      'fixed',
      tag.id,
      String(nextName).trim(),
      isAdminAuthed() ? { adminPass: ADMIN_PASSWORD } : {}
    )
    if (!ok) {
      showSaveStatus('编辑失败（请确认管理员权限或名称可能重复）', false)
      return
    }
    await refreshAboutTagsForAdmin()
    showSaveStatus('固定标签已编辑')
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
  }

  const handleDeleteFixedTag = async (tag) => {
    if (!tag?.id) return
    const okConfirm = window.confirm(`确定删除固定标签「${tag.name || ''}」吗？\n删除后粉丝的该标签点赞可能不再生效。`)
    if (!okConfirm) return
    const ok = await dataManager.deleteAboutTag(
      'fixed',
      tag.id,
      isAdminAuthed() ? { adminPass: ADMIN_PASSWORD } : {}
    )
    if (!ok) {
      showSaveStatus('删除失败（请确认管理员权限）', false)
      return
    }
    await refreshAboutTagsForAdmin()
    showSaveStatus('固定标签已删除')
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
  }

  const handleEditExtraTag = async (tag) => {
    if (!tag?.id) return
    const nextName = window.prompt('编辑备用标签名称：', tag.name || '')
    if (!nextName) return
    const ok = await dataManager.editAboutTagName(
      'extra',
      tag.id,
      String(nextName).trim(),
      isAdminAuthed() ? { adminPass: ADMIN_PASSWORD } : {}
    )
    if (!ok) {
      showSaveStatus('编辑失败（请确认管理员权限或名称可能重复）', false)
      return
    }
    await refreshAboutTagsForAdmin()
    showSaveStatus('备用标签已编辑')
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
  }

  const handleDeleteExtraTag = async (tag) => {
    if (!tag?.id) return
    const okConfirm = window.confirm(`确定删除备用标签「${tag.name || ''}」吗？`)
    if (!okConfirm) return
    const ok = await dataManager.deleteAboutTag(
      'extra',
      tag.id,
      isAdminAuthed() ? { adminPass: ADMIN_PASSWORD } : {}
    )
    if (!ok) {
      showSaveStatus('删除失败（请确认管理员权限）', false)
      return
    }
    await refreshAboutTagsForAdmin()
    showSaveStatus('备用标签已删除')
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
  }

  const handleAddExtraTag = async () => {
    const name = String(newExtraTagName ?? '').trim()
    if (!name) {
      showSaveStatus('请输入标签名称', false)
      return
    }
    const created = await dataManager.suggestAboutTag(name)
    if (!created?.id) {
      showSaveStatus('添加失败（可能已存在同名标签）', false)
      return
    }
    setNewExtraTagName('')
    await refreshAboutTagsForAdmin()
    showSaveStatus('备用标签已添加')
    window.dispatchEvent(new Event('xiaoyi-data-updated'))
  }

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

        <div className="admin-actions">
          <button type="button" className="btn-export btn-reset" onClick={handleResetToDefault}>
            重置为默认数据（清空本地配置）
          </button>
        </div>

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
                    {songs.map((song, index) => (
                      <div key={song.id ?? `${song.title}-${index}`} className="song-item">
                        <span className="song-title">{song.title}</span>
                        <span className="song-genre">{song.genre}</span>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteSong(index)}
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
                      type="date"
                      value={newLive.dateISO}
                      onChange={(e) => setNewLive({ ...newLive, dateISO: e.target.value })}
                    />
                    <input
                      type="time"
                      value={newLive.startTime}
                      onChange={(e) => setNewLive({ ...newLive, startTime: e.target.value })}
                    />
                    <input
                      type="time"
                      value={newLive.endTime}
                      onChange={(e) => setNewLive({ ...newLive, endTime: e.target.value })}
                    />
                    <select
                      value={newLive.liveType}
                      onChange={(e) => setNewLive({ ...newLive, liveType: e.target.value })}
                    >
                      <option value="固定">固定</option>
                      <option value="随机">随机</option>
                    </select>
                    <button className="btn-add" onClick={handleAddLive}>
                      <FiPlus /> 添加
                    </button>
                  </div>
                </div>

                <div className="live-list">
                  <h4>当前预告</h4>
                  {mergedUpcomingLivesForAdmin.map((live) => (
                    <div key={live.id} className="live-item">
                      <div className="live-info">
                        <span
                          className="live-title"
                          style={{ cursor: 'pointer' }}
                          title="点击修改标题"
                          onClick={() => handleEditLiveTitle(live)}
                        >
                          {live.title}
                        </span>
                        <span className="live-meta">
                          <FiCalendar /> {live.date} <FiClock /> {live.time}
                        </span>
                        <span
                          style={{
                            marginTop: '0.25rem',
                            fontSize: '0.85rem',
                            color: live.liveType === '随机' ? 'rgba(139, 92, 246, 0.95)' : 'rgba(224, 192, 151, 0.95)',
                            fontWeight: 800,
                          }}
                        >
                          {live.liveType}
                        </span>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => {
                          if (live._manualId) handleDeleteLive(live._manualId)
                          else handleHideLiveByGenerated(live)
                        }}
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
                <h3>时段活动池（每天随机掉落）</h3>
                <div className="add-form">
                  <h4>添加新安排</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="适用范围（如：每天 / 周三）"
                      value={newSchedule.day}
                      onChange={e => setNewSchedule({ ...newSchedule, day: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="时间（填：13:00 - 15:00 / 16:00 - 18:00 / 21:00 - 22:00 或 13-15 / 21-22）"
                      value={newSchedule.time}
                      onChange={e => {
                        const time = e.target.value
                        setNewSchedule({ ...newSchedule, time, liveType: deriveLiveTypeFromTime(time) })
                      }}
                    />
                    <select
                      value={newSchedule.liveType}
                      onChange={(e) => setNewSchedule({ ...newSchedule, liveType: e.target.value })}
                    >
                      <option value="固定">固定</option>
                      <option value="随机">随机</option>
                    </select>
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
                        <span className="schedule-activity" style={{ color: 'rgba(224, 192, 151, 0.9)', marginTop: '0.25rem' }}>
                          {item.liveType || ''}
                        </span>
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

            {/* 关于标签互动 */}
            {activeTab === 'about-tags' && (
              <div className="tab-content">
                <h3>关于标签互动</h3>
                <p className="section-hint">固定标签：粉丝可点赞；备用标签：粉丝提名，管理员可加入固定。</p>

                <div className="divider"></div>

                <div className="tag-manage-block">
                  <h4>固定标签</h4>
                  <div className="tag-fixed-list">
                    {(aboutFixedTags || []).length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.55)' }}>暂无固定标签</p>
                    ) : (
                      (aboutFixedTags || []).map((t) => (
                        <div key={t.id} className="tag-row">
                          <span className="tag-row-name">{t.name}</span>
                          <div className="tag-row-right">
                            <span className="tag-row-count">{t.likeCount ?? 0} 赞</span>
                            <div className="tag-actions">
                              <button
                                type="button"
                                className="btn-tag-edit btn-add--small"
                                onClick={() => handleEditFixedTag(t)}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="btn-tag-delete btn-add--small"
                                onClick={() => handleDeleteFixedTag(t)}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="divider"></div>

                <div className="tag-manage-block">
                  <h4>备用标签</h4>
                  <div className="tag-fixed-list">
                    {(aboutExtraTags || []).length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.55)' }}>暂无备用标签</p>
                    ) : (
                      (aboutExtraTags || []).map((t) => (
                        <div key={t.id} className="tag-row tag-row--extra">
                          <div className="tag-row-left">
                            <span className="tag-row-name">{t.name}</span>
                            <span className="tag-row-count">{t.suggestCount ?? 0} 提名</span>
                          </div>
                          <div className="tag-row-right">
                            <div className="tag-actions">
                              <button
                                type="button"
                                className="btn-tag-edit btn-add--small"
                                onClick={() => handleEditExtraTag(t)}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="btn-tag-delete btn-add--small"
                                onClick={() => handleDeleteExtraTag(t)}
                              >
                                删除
                              </button>
                            </div>
                            <button
                              className="btn-add btn-add--small"
                              onClick={() => handlePromoteExtraTag(t.id)}
                              type="button"
                            >
                              <FiPlus /> 加入固定
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="divider" />

                  <div className="add-tag-form" style={{ marginTop: '1rem' }}>
                    <h5 style={{ margin: '0 0 0.75rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                      直接添加备用标签
                    </h5>
                    <div className="form-row">
                      <input
                        type="text"
                        value={newExtraTagName}
                        onChange={(e) => setNewExtraTagName(e.target.value)}
                        placeholder="输入标签名（回车或点击添加）"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddExtraTag()
                        }}
                      />
                      <button className="btn-add btn-add--small" onClick={handleAddExtraTag} type="button">
                        <FiPlus /> 添加
                      </button>
                    </div>
                  </div>
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
