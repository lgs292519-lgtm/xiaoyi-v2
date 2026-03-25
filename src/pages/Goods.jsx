import './Goods.css'

const Goods = () => {
  return (
    <div className="goods-page">
      <section className="goods-header">
        <div className="container">
          <h1 className="section-title">周边好物</h1>
          <p className="header-desc">
            精彩内容即将上线
          </p>
        </div>
      </section>

      <section className="coming-soon-section">
        <div className="container">
          <div className="coming-soon-content">
            <h2>敬请期待</h2>
            <p>周边好物即将与您见面</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Goods
