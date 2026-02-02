import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const CastingRole = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="casting-role" categoryName={t('categories:titles.casting-role')} />
      <Footer />
    </div>
  )
}

export default CastingRole

