import './HeroSection.css'

const HeroSection = () => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">Bienvenue sur Ollync</h1>
        <p className="hero-subtitle">La plateforme de mise en relation pour créateurs de contenu</p>
        <div className="hero-actions">
          <button className="hero-button primary">Découvrir</button>
          <button className="hero-button secondary">Publier une annonce</button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection

