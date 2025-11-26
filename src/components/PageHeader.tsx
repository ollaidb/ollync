import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
}

const PageHeader = ({ title }: PageHeaderProps) => {
  const navigate = useNavigate()

  return (
    <div className="page-header-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={24} />
      </button>
      <h1 className="page-header-title">{title}</h1>
      <div className="back-button-placeholder"></div>
    </div>
  )
}

export default PageHeader

