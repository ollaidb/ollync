import { useState, useEffect } from 'react'
import { Palette, Moon, Sun } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import './Appearance.css'

const Appearance = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'light' | 'dark') || 'light'
  })
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('primaryColor') || '#667eea'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor)
    localStorage.setItem('primaryColor', primaryColor)
  }, [primaryColor])

  const colorPresets = [
    '#667eea', '#4facfe', '#f093fb', '#43e97b', '#ffa726',
    '#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f39c12'
  ]

  return (
    <div className="page">
      <PageHeader title="Apparence" />
      <div className="page-content appearance-page">
        <div className="appearance-container">
          <div className="appearance-section">
            <h3 className="appearance-section-title">Thème</h3>
            <div className="theme-selector">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={24} />
                <span>Clair</span>
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={24} />
                <span>Sombre</span>
              </button>
            </div>
          </div>

          <div className="appearance-section">
            <h3 className="appearance-section-title">Couleur principale</h3>
            <div className="color-selector">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  className={`color-option ${primaryColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setPrimaryColor(color)}
                >
                  {primaryColor === color && <span className="check">✓</span>}
                </button>
              ))}
            </div>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="color-picker"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appearance

