import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiMusic } from 'react-icons/fi'
import './Home.css'

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const touchStartRef = useRef({ x: 0, y: 0, active: false })
  const touchDeltaRef = useRef({ dx: 0, dy: 0, lastX: 0, lastY: 0, active: false })
  const suppressNextClickRef = useRef(false)
  
  const slides = [
    { title: '国风仙侠', genreValue: '国风仙侠', subtitle: '千古风华，侠骨柔情', tag: '唯美古风' },
    // 数据里是“情绪共鸣”，这里文案展示用“情感共鸣”
    { title: '情感共鸣', genreValue: '情绪共鸣', subtitle: '那些说不出口的话，让音乐替你表达', tag: '情感疗愈' },
    { title: '甜系元气', genreValue: '甜系元气', subtitle: '充满正能量的每一天', tag: '元气满满' },
    { title: '治愈抒情', genreValue: '治愈抒情', subtitle: '温暖心灵的声音', tag: '温暖治愈' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  const handleTouchStart = (e) => {
    const t = e.touches?.[0]
    if (!t) return
    touchStartRef.current = { x: t.clientX, y: t.clientY, active: true }
    touchDeltaRef.current = { dx: 0, dy: 0, lastX: t.clientX, lastY: t.clientY, active: true }
  }

  const handleTouchMove = (e) => {
    const start = touchStartRef.current
    if (!start.active) return
    const t = e.touches?.[0] || e.changedTouches?.[0]
    if (!t) return

    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // 记录整个手势过程中的“最大偏移”，用于触摸结束时判断
    touchDeltaRef.current = {
      ...touchDeltaRef.current,
      dx: dx,
      dy: dy,
      lastX: t.clientX,
      lastY: t.clientY,
      active: true,
    }
  }

  const handleTouchEnd = (e) => {
    const start = touchStartRef.current
    if (!start.active) return

    // 优先使用 onTouchMove 累积出的 delta（移动端更稳定）；兜底用 touchEnd 的坐标
    const moved = touchDeltaRef.current
    const t = e.changedTouches?.[0] || e.touches?.[0]
    const dx = Number.isFinite(moved?.dx) && moved?.active ? moved.dx : t ? t.clientX - start.x : 0
    const dy = Number.isFinite(moved?.dy) && moved?.active ? moved.dy : t ? t.clientY - start.y : 0

    // 防止误触：需要水平滑动明显、竖直位移较小
    const dxThreshold = 22 // 放宽：有些手机滑动幅度较小
    const dyThreshold = 220 // 放宽：允许轻微上下拖动
    if (Math.abs(dx) > dxThreshold && Math.abs(dy) < dyThreshold) {
      if (dx < 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      } else {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      }
      // 滑动切换时，避免点击落到“查看歌单”的链接上误跳转
      suppressNextClickRef.current = true
      window.setTimeout(() => {
        suppressNextClickRef.current = false
      }, 400)
    }
    touchStartRef.current.active = false
    touchDeltaRef.current.active = false
  }

  return (
    <div className="home">
      {/* 轮播区域 */}
      <section
        className="hero-section"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="carousel">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            >
              <div className="slide-overlay" />
              <div className="slide-content">
                <span className="slide-tag">{slide.tag}</span>
                <h1 className="slide-title">{slide.title}</h1>
                <p className="slide-subtitle">{slide.subtitle}</p>
                <Link
                  to={`/playlist?genre=${encodeURIComponent(slide.genreValue)}`}
                  className="slide-btn"
                  onClick={(e) => {
                    if (suppressNextClickRef.current) {
                      e.preventDefault()
                      e.stopPropagation()
                    }
                  }}
                >
                  <FiMusic /> 查看歌单
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`跳转到第${index + 1}张`}
            />
          ))}
        </div>
      </section>

      {/* 标语区域 */}
      <section className="slogan-section">
        <div className="container">
          <div className="slogan-content">
            <h2>「 愿音乐能治愈每一颗心灵 」</h2>
            <p>在音乐的海洋里，找到属于自己的那份宁静</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
