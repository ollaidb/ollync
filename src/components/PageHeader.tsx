import { useTranslation } from 'react-i18next'
import BackButton from './BackButton'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
}

const PageHeader = ({ title }: PageHeaderProps) => {
  const { t } = useTranslation(['titles'])
  const translatedTitle = t(title, { ns: 'titles', defaultValue: title })
  return (
    <div className="page-header-container">
      <BackButton className="page-header-back-button" />
      <h1 className="page-header-title">{translatedTitle}</h1>
      <div className="back-button-placeholder"></div>
    </div>
  )
}

export default PageHeader

