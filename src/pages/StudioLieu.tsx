import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const StudioLieu = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage
        categorySlug="studio-lieu"
        categoryName={t('categories:titles.studio-lieu')}
      />
      <Footer />
    </div>
  )
}

export default StudioLieu
