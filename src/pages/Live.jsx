import { useState, useEffect } from 'react';
import { FiRadio, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import dataManager from '../utils/dataManager';
import './Live.css';

const Live = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const adminData = dataManager.getData();
    setData(adminData);
  }, []);

  if (!data) {
    return <div className="live-page"><div className="container">加载中...</div></div>;
  }

  const upcomingLives = data.upcomingLives || [];
  const regularSchedule = data.regularSchedule || [];

  return (
    <div className="live-page">
      <section className="live-header">
        <div className="container">
          <h1 className="section-title">直播时间</h1>
          <p className="header-desc">
            <FiRadio /> 每周固定直播 · 与你不见不散
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
                  <div className="upcoming-meta">
                    <span><FiCalendar /> {live.date}</span>
                    <span><FiClock /> {live.time}</span>
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
          <h2 className="subsection-title">固定直播安排</h2>
          <div className="schedule-grid">
            {regularSchedule.map((item, index) => (
              <div key={item.id || index} className="schedule-card">
                <div className="schedule-content">
                  <h3>{item.day}</h3>
                  <p className="schedule-time">{item.time}</p>
                  <p className="schedule-activity">{item.activity}</p>
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
