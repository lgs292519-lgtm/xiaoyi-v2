import { useState, useEffect } from 'react';
import { FiRadio, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import dataManager from '../utils/dataManager';
import './Live.css';

const WEEKDAY_TO_CN = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
};

function parseTimeRangeToSlot(timeStr) {
  // 支持：13:00 - 15:00 / 13-15 / 21:00-22:00
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

  // 重点：优先匹配 “HH:00-HH:00” 或 “HH:00-HH”
  const m1 = s.match(/^(\d{1,2})(?::[0]*0)?-(\d{1,2})(?::[0]*0)?$/)
  // 次级：匹配 “HH-HH”
  const m2 = !m1 ? s.match(/^(\d{1,2})[-—~至](\d{1,2})$/) : null
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

function clampInt(n, { min, max, fallback }) {
  const v = Number.parseInt(String(n ?? ''), 10);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function formatISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNowMinutes(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

function hashToInt(str) {
  // Simple deterministic hash (non-crypto), stable per day/slot.
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function parseSlotKeyFromRegularScheduleTime(timeStr) {
  const s = String(timeStr ?? '').replace(/\s/g, '');
  // Accept: 13:00-15:00 / 13-15 / 16-18 / 21:00 - 22:00
  if ((s.includes('13') && s.includes('15')) || s.includes('13-15')) return '13-15';
  if ((s.includes('16') && s.includes('18')) || s.includes('16-18')) return '16-18';
  if ((s.includes('21') && s.includes('22')) || s.includes('21-22')) return '21-22';
  if ((s.includes('20') && s.includes('21')) || s.includes('20-21')) return '20-21';
  return null;
}

function parseHourFromTime(timeStr) {
  // 兼容：20:00、20点、20-21等，取第一个小时数字
  const m = String(timeStr ?? '').match(/(\d{1,2})/);
  if (!m) return null
  const hh = Number(m[1])
  if (!Number.isFinite(hh)) return null;
  return clampInt(hh, { min: 0, max: 23, fallback: null });
}

function selectDeterministic(arr, seedStr) {
  const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (list.length === 0) return '';
  const idx = hashToInt(seedStr) % list.length;
  return list[idx];
}

function parseISODateParts(dateISO) {
  const m = String(dateISO ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(day)) return null;
  return { y, mo, day };
}

function parseLocalDateTime(dateISO, timeHHMM) {
  const dateParts = parseISODateParts(dateISO);
  if (!dateParts) return null;
  const t = String(timeHHMM ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!t) return null;
  const hh = Number(t[1]);
  const mm = Number(t[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  const dt = new Date(dateParts.y, dateParts.mo - 1, dateParts.day, hh, mm, 0, 0);
  const ms = dt.getTime();
  if (!Number.isFinite(ms)) return null;
  return ms;
}

function formatDateLabel(dateISO) {
  const parts = parseISODateParts(dateISO);
  if (!parts) return String(dateISO ?? '');
  const now = new Date();
  if (now.getFullYear() === parts.y && now.getMonth() + 1 === parts.mo && now.getDate() === parts.day) {
    return '今天';
  }
  return `${parts.mo}月${parts.day}日`;
}

function formatTimeRangeDisplay(startTime, endTime) {
  const s = String(startTime ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  const e = String(endTime ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!s || !e) return '';
  const sh = String(Number(s[1])).padStart(2, '0');
  const sm = s[2];
  const eh = String(Number(e[1])).padStart(2, '0');
  const em = e[2];
  return `${sh}：${sm}-${eh}：${em}`;
}

const Live = () => {
  const [data, setData] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const loadData = () => {
    const adminData = dataManager.getData();
    setData(adminData);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 当管理界面更新 localStorage 后，Live 页需要同步刷新
  useEffect(() => {
    const onUpdate = () => loadData();
    window.addEventListener('xiaoyi-data-updated', onUpdate);
    // 兼容多 Tab 场景
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('xiaoyi-data-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!data) {
    return <div className="live-page"><div className="container">加载中...</div></div>;
  }

  const upcomingLivesManual = data.upcomingLives || [];
  const regularSchedule = data.regularSchedule || [];
  const douyinLiveUrl = data?.contact?.douyinLive || '';

  const now = new Date(nowTick);
  const todayISO = formatISODate(now);
  const todayCN = WEEKDAY_TO_CN[now.getDay()];
  const nowMinutes = getNowMinutes(now);

  // 从固定安排（regularSchedule）动态生成：没有配置的时段不展示
  const scheduleEntriesBySlotKey = new Map() // slotKey => { parsedSlot, entries }
  for (const item of (regularSchedule || [])) {
    if (!item) continue
    const parsed = parseTimeRangeToSlot(item?.time)
    if (!parsed) continue

    const key = parsed.slotKey
    if (!scheduleEntriesBySlotKey.has(key)) {
      scheduleEntriesBySlotKey.set(key, { parsedSlot: parsed, entries: [] })
    }
    scheduleEntriesBySlotKey.get(key).entries.push(item)
  }

  const dailySchedule = []
  for (const [slotKey, value] of scheduleEntriesBySlotKey.entries()) {
    const { parsedSlot, entries } = value

    const slotPoolDaily = entries.filter((e) => {
      const day = String(e?.day ?? '')
      return !day || day === '每天' || day === todayCN
    })
    const poolSource = slotPoolDaily.length ? slotPoolDaily : entries
    // 重要：把“未配置活动”等占位值当作空，确保“删了就不显示”
    const pool = poolSource
      .map((e) => String(e?.activity ?? '').trim())
      .filter((t) => t && t !== '未配置活动');
    if (!pool.length) continue // 无配置 => 隐藏该时段

    // 若同一时段存在多条记录，取“最后设置/最后存在”的 liveType，避免数组顺序导致选择被忽略
    let liveTypeFromItems = undefined
    for (let i = entries.length - 1; i >= 0; i--) {
      const lt = entries[i]?.liveType
      if (lt === '固定' || lt === '随机') {
        liveTypeFromItems = lt
        break
      }
    }
    const liveType = liveTypeFromItems || parsedSlot.liveType
    const seedStr = liveType === '随机' ? `${todayISO}-${slotKey}` : `${slotKey}-fixed`
    const title = selectDeterministic(pool, seedStr)

    dailySchedule.push({
      slotKey,
      startHour: parsedSlot.startHour,
      startMin: parsedSlot.startMin,
      timeRangeDisplay: parsedSlot.timeRangeDisplay,
      time: parsedSlot.slotZh,
      liveType,
      title,
    })
  }

  dailySchedule.sort((a, b) => a.startMin - b.startMin)

  const todayDate = new Date(nowTick)

  // 即将直播：只展示未来的已配置时段；若管理端手动预告属于该时段，会覆盖标题
  const slotByStartHour = new Map(dailySchedule.map((s) => [s.startHour, s]))
  const overrides = new Map() // slotKey => manual live
  for (const m of upcomingLivesManual) {
    if (!m) continue
    // 手动“任意时间预告”（带 startTime/endTime）不参与覆盖固定时段卡片
    if (m.startTime && m.endTime) continue

    const hour = parseHourFromTime(m.time)
    if (hour === null) continue
    const slot = slotByStartHour.get(hour)
    if (!slot) continue // fixed 安排不存在 => 不展示
    if (slot.startMin < nowMinutes) continue // 已开始/已过去 => 不展示在即将直播

    overrides.set(slot.slotKey, m)
  }

  const fixedUpcomingLives = dailySchedule
    .filter((slot) => nowMinutes < slot.startMin)
    .map((slot) => {
      const override = overrides.get(slot.slotKey)
      // 管理端“删除自动生成项”本质是写一条已隐藏记录；
      // 前端渲染时跳过该时段，确保卡片真的消失。
      if (override && override.status === '已隐藏') return null

      if (!override) {
        const startAtMs = new Date(
          todayDate.getFullYear(),
          todayDate.getMonth(),
          todayDate.getDate(),
          slot.startHour,
          0,
          0,
          0
        ).getTime()
        return {
          id: `auto-${todayISO}-${slot.slotKey}`,
          title: slot.title,
          date: '今天',
          time: slot.time,
          timeRangeDisplay: slot.timeRangeDisplay,
          liveType: slot.liveType,
          platform: 'douyin',
          status: '预告',
          _startAtMs: startAtMs,
        }
      }

      const startAtMs = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate.getDate(),
        slot.startHour,
        0,
        0,
        0
      ).getTime()
      return {
        ...override,
        id: `override-${override.id ?? slot.slotKey}-${todayISO}-${slot.slotKey}`,
        title: override.title || slot.title,
        date: override.date || '今天',
        time: slot.time,
        timeRangeDisplay: slot.timeRangeDisplay,
        // 管理端可选手动覆盖“固定/随机”标签
        liveType: override.liveType || slot.liveType,
        platform: override.platform || 'douyin',
        status: override.status || '预告',
        _startAtMs: startAtMs,
      }
    })
    .filter(Boolean)

  fixedUpcomingLives.sort((a, b) => a._startAtMs - b._startAtMs)

  // 手动预告（不依赖固定三段时段）：只要 startTime/endTime + dateISO 且时间未过去就展示
  const manualExtras = upcomingLivesManual
    .filter((m) => m && m.status !== '已隐藏' && m.dateISO && m.startTime && m.endTime)
    .map((m) => {
      const startAtMs = parseLocalDateTime(m.dateISO, m.startTime)
      if (startAtMs === null || startAtMs <= nowTick) return null

      const startHour = (() => {
        const mm = String(m.startTime ?? '').match(/^(\d{1,2}):/)
        return mm ? Number(mm[1]) : null
      })()
      return {
        id: `manual-${m.id ?? startAtMs}`,
        title: m.title || '',
        date: m.date || formatDateLabel(m.dateISO),
        time: m.time || `${m.startTime}-${m.endTime}`,
        timeRangeDisplay: m.timeRangeDisplay || formatTimeRangeDisplay(m.startTime, m.endTime),
        liveType: m.liveType || '固定',
        platform: m.platform || 'douyin',
        status: '预告',
        _startAtMs: startAtMs,
      }
    })
    .filter(Boolean)

  const upcomingLives = [...fixedUpcomingLives, ...manualExtras].sort((a, b) => a._startAtMs - b._startAtMs)

  return (
    <div className="live-page">
      <section className="live-header">
        <div className="container">
          <h1 className="section-title">直播时间</h1>
          <p className="header-desc">
            <FiRadio /> 每天三段时段随机掉落 · 与你不见不散
          </p>
        </div>
      </section>

      {/* 即将直播 */}
      <section className="upcoming-live">
        <div className="container">
          <h2 className="subsection-title">即将直播</h2>
          <div className="upcoming-grid">
            {upcomingLives.map((live) => (
              <div key={live.id} className="upcoming-card">
                <div className="upcoming-info">
                  <h3>{live.title}</h3>
                  <span
                    className={`upcoming-live-type upcoming-live-type--${live.liveType === '固定' ? 'fixed' : 'random'}`}
                  >
                    {live.liveType}
                  </span>
                  <div className="upcoming-meta">
                    <span><FiCalendar /> {live.date}</span>
                    <span><FiClock /> {live.timeRangeDisplay}</span>
                  </div>
                  <span className="upcoming-platform">{live.platform}</span>
                  {douyinLiveUrl ? (
                    <button
                      type="button"
                      className="upcoming-enter-btn"
                      aria-label="进入直播间"
                      onClick={() => {
                        // 移动端更稳定的跳转方式（避免弹窗拦截）
                        window.location.href = douyinLiveUrl;
                      }}
                    >
                      进入直播间
                    </button>
                  ) : (
                    <span className="upcoming-enter-missing">未配置直播间链接</span>
                  )}
                </div>
                <span className="upcoming-status">{live.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 固定直播时间 */}
      <section className="regular-schedule">
        <div className="container">
          <h2 className="subsection-title">今日日程表</h2>
          <div className="schedule-grid">
            {dailySchedule.map((item) => (
              <div key={item.slotKey} className="schedule-card">
                <div className="schedule-content">
                          <h3>{item.timeRangeDisplay}</h3>
                  <p
                    className={`schedule-live-type schedule-live-type--${item.liveType === '固定' ? 'fixed' : 'random'}`}
                  >
                    {item.liveType}
                  </p>
                  <p className="schedule-time">今天</p>
                  <p className="schedule-activity">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

export default Live
