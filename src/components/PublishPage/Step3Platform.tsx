import { Option } from '../../constants/publishData'
import './Step3Platform.css'

interface Step3PlatformProps {
  selectedOption: Option | null
  onSelectPlatform: (platform: string) => void
}

export const Step3Platform = ({ selectedOption, onSelectPlatform }: Step3PlatformProps) => {
  if (!selectedOption || !selectedOption.platforms || selectedOption.platforms.length === 0) {
    return null
  }

  return (
    <div className="step3-platform">
      <h2 className="step-title">Choisissez une plateforme</h2>
      <div className="platforms-grid">
        {selectedOption.platforms.map((platform) => (
          <button
            key={platform.id}
            className="platform-card"
            onClick={() => onSelectPlatform(platform.id)}
          >
            <span className="platform-name">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

