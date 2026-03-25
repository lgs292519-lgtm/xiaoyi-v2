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

const SLOT_DEFS = [
  { key: '13-15', startMin: 13 * 60, endMin: 15 * 60, slotZh: '13-15点', timeRangeDisplay: '13：00-15：00', liveType: '固定' },
  { key: '16-18', startMin: 16 * 60, endMin: 18 * 60, slotZh: '16-18点', timeRangeDisplay: '16：00-18：00', liveType: '固定' },
  { key: '20-21', startMin: 20 * 60, endMin: 21 * 60, slotZh: '20-21点', timeRangeDisplay: '20：00-21：00', liveType: '随机' },
];

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
  // Accept: 13:00-15:00 / 13-15 / 16-18 / 20:00 - 21:00
  if ((s.includes('13') && s.includes('15')) || s.includes('13-15')) return '13-15';
  if ((s.includes('16') && s.includes('18')) || s.includes('16-18')) return '16-18';
  if ((s.includes('20') && s.includes('21')) || s.includes('20-21')) return '20-21';
  return null;
}

function parseHourFromTime(timeStr) {
  const m = String(timeStr ?? '').match(/(\d{1,2})\s*[:：]/);
  if (!m) return null;
  const hh = Number(m[1]);
  if (!Number.isFinite(hh)) return null;
  return clampInt(hh, { min: 0, max: 23, fallback: null });
}

function parseSlotKeyFromHour(hour) {
  if (hour === null || hour === undefined) return null;
  if (hour >= 13 && hour < 16) return '13-15';
  if (hour >= 16 && hour < 19) return '16-18';
  if (hour >= 20 && hour < 22) return '20-21';
  return null;
}

function selectDeterministic(arr, seedStr) {
  const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (list.length === 0) return '';
  const idx = hashToInt(seedStr) % list.length;
  return list[idx];
}

const Live = () => {
  const [data, setData] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const adminData = dataManager.getData();
    setData(adminData);
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

  const now = new Date(nowTick);
  const todayISO = formatISODate(now);
  const todayCN = WEEKDAY_TO_CN[now.getDay()];
  const nowMinutes = getNowMinutes(now);

  const dailySchedule = SLOT_DEFS.map((slot) => {
    const slotPoolAll = (regularSchedule || [])
      .filter((item) => {
        const slotKey = parseSlotKeyFromRegularScheduleTime(item?.time);
        return slotKey === slot.key;
      });

    // 如果管理界面里存在 day=“每天”的配置，就只用它；否则兼容旧数据（周三/周六等），也让它每天可用。
    const slotPoolDaily = slotPoolAll.filter((item) => {
      const day = String(item?.day ?? '');
      return !day || day === '每天' || day === todayCN;
    });

    const poolSource = slotPoolDaily.length ? slotPoolDaily : slotPoolAll;
    const pool = poolSource.map((item) => String(item?.activity ?? '').trim()).filter(Boolean);

    const fallbacks = {
      '13-15': '午后歌声相伴',
      '16-18': '傍晚治愈电台',
      '20-21': '晚间心动专场',
    };

    // 需求：13-15固定、16-18固定、20-21随机
    const activity = pool.length
      ? selectDeterministic(
        pool,
        slot.liveType === '随机' ? `${todayISO}-${slot.key}` : `${slot.key}-fixed`
      )
      : fallbacks[slot.key];
    return {
      slotKey: slot.key,
      date: todayCN,
      timeRangeDisplay: slot.timeRangeDisplay,
      liveType: slot.liveType,
      title: activity,
    };
  });

  // 生成“即将直播”预告：只展示还没过去的时段
  const autoUpcomingSlots = SLOT_DEFS.filter((slot) => nowMinutes < slot.startMin).map((slot) => {
    const scheduled = dailySchedule.find((d) => d.slotKey === slot.key);
    return {
      id: `auto-${todayISO}-${slot.key}`,
      title: scheduled?.title || '',
      date: '今天',
      time: slot.slotZh,
      timeRangeDisplay: slot.timeRangeDisplay,
      liveType: slot.liveType,
      platform: 'douyin',
      status: '预告',
      _slotKey: slot.key,
      _startMin: slot.startMin,
    };
  });

  // 管理界面“即将直播”可自定义增加：这里将手动预告与自动预告合并。
  // 若手动预告属于同一时段且日期是“今天”，则用手动标题覆盖自动标题，避免重复。
  const overrides = new Map();

  const todayStartMin = nowMinutes;
  for (const m of upcomingLivesManual) {
    if (!m) continue;
    const manualDate = String(m.date ?? '');
    const hour = parseHourFromTime(m.time);
    const manualSlotKey = parseSlotKeyFromHour(hour);
    const isToday = manualDate === todayCN || manualDate === '今天';
    const startMin = hour !== null ? hour * 60 : null;
    const passed = isToday && startMin !== null && startMin < todayStartMin;
    if (passed) continue;

    // 需求：即将直播只展示今天三个时段，其他日期的手动预告不参与展示。
    if (isToday && manualSlotKey) {
      overrides.set(manualSlotKey, m);
    }
  }

  const upcomingLives = [];
  for (const auto of autoUpcomingSlots) {
    const override = overrides.get(auto._slotKey);
    if (override) {
      upcomingLives.push({
        ...override,
        id: `override-${override.id ?? auto._slotKey}-${todayISO}-${auto._slotKey}`,
        title: override.title || auto.title,
        date: override.date || auto.date,
        time: override.time || auto.time,
        timeRangeDisplay: auto.timeRangeDisplay,
        liveType: auto.liveType,
        platform: override.platform || auto.platform,
        status: override.status || auto.status,
        _startMin: auto._startMin,
      });
    } else {
      upcomingLives.push(auto);
    }
  }

  // include manual extras
  // （不再加入 manualExtras，避免出现“周末歌声相伴/新歌首发专场/粉丝点歌夜”等非今天条目）

  // sort by start time for better UX on upcoming-grid
  upcomingLives.sort((a, b) => {
    const am = a?._startMin;
    const bm = b?._startMin;
    if (am === undefined && bm === undefined) return 0;
    if (am === undefined) return 1;
    if (bm === undefined) return -1;
    return am - bm;
  });

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
