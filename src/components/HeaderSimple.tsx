import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './HeaderSimple.css'

interface HeaderSimpleProps {
  title: string
  showBack?: boolean
}

const HeaderSimple = ({ title, showBack = true }: HeaderSimpleProps) => {
  const navigate = useNavigate()

  return (
    <header className="header-simple">
      {showBack && (
        <button className="header-simple-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="header-simple-title">{title}</h1>
      <div className="header-simple-spacer"></div>
    </header>
  )
}

export default HeaderSimple

