import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const Montage = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="montage" categoryName={t('categories:titles.montage')} />
      <Footer />
    </div>
  )
}

export default Montage

