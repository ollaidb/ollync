import BackButton from './BackButton'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
}

const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <div className="page-header-container">
      <BackButton className="page-header-back-button" />
      <h1 className="page-header-title">{title}</h1>
      <div className="back-button-placeholder"></div>
    </div>
  )
}

export default PageHeader

