import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const Suivi = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="suivi" categoryName={t('categories:titles.suivi')} />
      <Footer />
    </div>
  )
}

export default Suivi

