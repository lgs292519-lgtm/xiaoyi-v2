import { useState } from 'react'
import { FiSearch, FiMusic } from 'react-icons/fi'
import songData from '../data/songs.json'
import './Playlist.css'

const Playlist = () => {
  const [currentGenre, setCurrentGenre] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const genres = ['全部', '国风仙侠', '治愈抒情', '情绪共鸣', '甜系元气']

  const filteredSongs = songData.filter(song => {
    const matchGenre = currentGenre === '全部' || song.genre === currentGenre
    const matchSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase())
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
                <FiMusic /> 共收录 {songData.length} 首歌曲 · 4种风格分类
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
          <div className="tabs-wrapper">
            {genres.map(genre => (
              <button
                key={genre}
                className={`tab-btn ${currentGenre === genre ? 'active' : ''}`}
                onClick={() => setCurrentGenre(genre)}
                style={{
                  '--tab-color': genreColors[genre] || 'var(--color-accent-gold)',
                }}
              >
                {genre}
                <span className="tab-count">{songData.filter(s => genre === '全部' || s.genre === genre).length}</span>
              </button>
            ))}
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
                        {song.genre}
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
