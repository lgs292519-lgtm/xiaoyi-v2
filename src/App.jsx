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
import dataManager from './utils/dataManager'

function App() {
  const audioRef = useRef(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminData, setAdminData] = useState(null)

  useEffect(() => {
    const data = dataManager.getData();
    setAdminData(data);
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
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              cursor: 'pointer'
            }}
            onClick={startMusic}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: "url('/images/beijing.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)'
            }} />
            <div style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
              paddingBottom: '80px'
            }}>
              <h1 style={{ color: 'white', fontSize: '96px', marginBottom: '30px', textShadow: '2px 2px 8px rgba(0,0,0,0.7)', fontFamily: 'var(--font-serif)' }}>
                {adminData?.headerText?.title || '欢迎来到 XIAOYI'}
              </h1>
              <p style={{ color: 'white', fontSize: '40px', opacity: 0.9, textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
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
          </Routes>
        </main>
        <Footer onAdminClick={handleAdminClick} />

        {showAdmin && <AdminPanel onClose={handleCloseAdmin} />}
      </div>
    </BrowserRouter>
  )
}

export default App
