import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const Evenements = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="evenements" categoryName={t('categories:titles.evenements')} />
      <Footer />
    </div>
  )
}

export default Evenements

