import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiMusic } from 'react-icons/fi'
import './Home.css'

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    { title: '国风仙侠', subtitle: '千古风华，侠骨柔情', tag: '唯美古风' },
    { title: '治愈抒情', subtitle: '温暖心灵的声音', tag: '温暖治愈' },
    { title: '情绪共鸣', subtitle: '那些说不出口的话，让音乐替你表达', tag: '情感疗愈' },
    { title: '甜系元气', subtitle: '充满正能量的每一天', tag: '元气满满' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="home">
      {/* 轮播区域 */}
      <section className="hero-section">
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
                <Link to="/playlist" className="slide-btn">
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
