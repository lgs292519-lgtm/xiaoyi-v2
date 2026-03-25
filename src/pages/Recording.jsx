import { FiVideo } from 'react-icons/fi';
import './Recording.css';

const recordingUrl = 'https://www.alipan.com/s/Z46yB47C7F7';

export default function Recording() {
  return (
    <div className="recording-page">
      <section className="recording-header">
        <div className="container">
          <h1 className="section-title">
            <FiVideo /> 录屏回放
          </h1>
          <p className="header-desc">点击下方卡片直接打开录屏链接</p>
        </div>
      </section>

      <section className="recording-main">
        <div className="container">
          <a
            className="recording-card"
            href={recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="recording-card__title">录屏回放入口</div>
            <div className="recording-card__hint">如无法打开，请稍等后重试</div>
          </a>
        </div>
      </section>
    </div>
  );
}

