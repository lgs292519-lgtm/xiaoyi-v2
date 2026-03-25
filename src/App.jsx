import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminPanel from './components/AdminPanel'
import Home from './pages/Home'
import Playlist from './pages/Playlist'
import Goods from './pages/Goods'
import Live from './pages/Live'
import About from './pages/About'
import CottonCandy from './pages/CottonCandy'
import Recording from './pages/Recording'
import dataManager from './utils/dataManager'
import './App.css'

function App() {
  const audioRef = useRef(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminData, setAdminData] = useState(null)

  useEffect(() => {
    const data = dataManager.getData()
    setAdminData(data)

    // 跨设备同步：首次拉取服务端管理数据到本地
    dataManager.syncAdminDataFromServer?.().then(() => {
      setAdminData(dataManager.getData())
    })

    // 跨设备同步：定时轮询服务端，确保其它设备不用刷新也能看到更新
    const timer = window.setInterval(() => {
      dataManager.syncAdminDataFromServer?.().then(() => {
        setAdminData(dataManager.getData())
      })
    }, 60_000)

    const onUpdated = () => setAdminData(dataManager.getData())
    window.addEventListener('xiaoyi-data-updated', onUpdated)
    return () => {
      window.removeEventListener('xiaoyi-data-updated', onUpdated)
      window.clearInterval(timer)
    }
  }, []);

  const startMusic = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3
      audioRef.current.play()
    }
    setShowWelcome(false)
  }

  const handleAdminClick = () => {
    setShowAdmin(true);
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    const data = dataManager.getData();
    setAdminData(data);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <audio ref={audioRef} src="/music/yueding.mp3" loop />

        {showWelcome && (
          <div className="welcome-screen" onClick={startMusic} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startMusic(); } }}>
            <div className="welcome-screen__bg" aria-hidden />
            <div className="welcome-screen__dim" aria-hidden />
            <div className="welcome-screen__content">
              <h1 className="welcome-screen__title">
                {adminData?.headerText?.title || '欢迎来到 XIAOYI'}
              </h1>
              <p className="welcome-screen__subtitle">
                {adminData?.headerText?.subtitle || '点击任意处开始'}
              </p>
            </div>
          </div>
        )}

        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/goods" element={<Goods />} />
            <Route path="/live" element={<Live />} />
            <Route path="/about" element={<About />} />
            <Route path="/cotton-candy" element={<CottonCandy />} />
            <Route path="/recording" element={<Recording />} />
          </Routes>
        </main>
        <Footer onAdminClick={handleAdminClick} />

        {showAdmin && <AdminPanel onClose={handleCloseAdmin} />}
      </div>
    </BrowserRouter>
  )
}

export default App
