import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiSearch, FiMusic } from 'react-icons/fi'
import songData from '../data/songs.json'
import dataManager from '../utils/dataManager'
import './Playlist.css'

const Playlist = () => {
  const [currentGenre, setCurrentGenre] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams] = useSearchParams()
  const [songsAll, setSongsAll] = useState(songData)

  const genreTabs = [
    { label: '全部', value: '全部' },
    { label: '国风仙侠', value: '国风仙侠' },
    // 数据里是“情绪共鸣”，这里文案展示用“情感共鸣”
    { label: '情感共鸣', value: '情绪共鸣' },
    { label: '甜系元气', value: '甜系元气' },
    { label: '治愈抒情', value: '治愈抒情' },
  ]

  const genreDisplayByValue = genreTabs.reduce((acc, cur) => {
    acc[cur.value] = cur.label
    return acc
  }, {})

  const genres = genreTabs.map((g) => g.value)

  useEffect(() => {
    const g = searchParams.get('genre')
    if (!g) return
    if (genres.includes(g)) {
      setCurrentGenre(g)
      return
    }
    // 兼容：如果传参是“情感共鸣”（label），则映射到 value（情绪共鸣）
    const mapped = genreTabs.find((t) => t.label === g)?.value
    if (mapped) setCurrentGenre(mapped)
  }, [searchParams])

  useEffect(() => {
    const refreshSongs = () => {
      const d = dataManager.getData()
      const list = Array.isArray(d?.songs) && d.songs.length ? d.songs : songData
      setSongsAll(list)
    }
    refreshSongs()
    window.addEventListener('xiaoyi-data-updated', refreshSongs)
    return () => window.removeEventListener('xiaoyi-data-updated', refreshSongs)
  }, [])

  const filteredSongs = songsAll.filter((song) => {
    const matchGenre = currentGenre === '全部' || song.genre === currentGenre
    const title = String(song?.title ?? '')
    const matchSearch = title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchGenre && matchSearch
  })

  const genreColors = {
    '国风仙侠': '#667eea',
    '治愈抒情': '#ec4899',
    '情绪共鸣': '#5b8def',
    '甜系元气': '#43e97b',
  }

  return (
    <div className="playlist-page">
      {/* 顶部区域 */}
      <section className="playlist-header">
        <div className="container">
          <div className="header-content">
            <div className="header-info">
              <h1 className="section-title">我的歌单</h1>
              <p className="header-desc">
                <FiMusic /> 共收录 {songsAll.length} 首歌曲 · 4种风格分类
              </p>
            </div>
            <div className="header-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="搜索歌曲..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 分类标签 */}
      <section className="genre-tabs">
        <div className="container">
          <div
            className="tabs-wrapper"
            role="tablist"
            aria-label="歌曲风格分类"
          >
            {genreTabs.map((tab) => {
              const genre = tab.value
              const label = tab.label
              return (
              <button
                key={genre}
                type="button"
                role="tab"
                aria-selected={currentGenre === genre}
                className={`tab-btn ${currentGenre === genre ? 'active' : ''}`}
                onClick={() => setCurrentGenre(genre)}
                style={{
                  '--tab-color': genreColors[genre] || 'var(--color-accent-gold)',
                }}
              >
                {label}
                <span className="tab-count">{songsAll.filter((s) => genre === '全部' || s.genre === genre).length}</span>
              </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 歌曲宫格 */}
      <section className="songs-grid-section">
        <div className="container">
          <div className="songs-grid">
            {filteredSongs.length === 0 ? (
              <div className="empty-state">
                <FiMusic />
                <p>没有找到相关歌曲</p>
              </div>
            ) : (
              filteredSongs.map((song, index) => (
                <div
                  key={`${song.title}-${index}`}
                  className="song-grid-item"
                >
                  <div className="song-info">
                    <span className="song-name">{song.title}</span>
                    {currentGenre !== '全部' && (
                      <span className="song-genre-tag" style={{ color: genreColors[song.genre] }}>
                        {genreDisplayByValue[song.genre] || song.genre}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Playlist
