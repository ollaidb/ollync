import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const Emploi = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="emploi" categoryName={t('categories:titles.emploi')} />
      <Footer />
    </div>
  )
}

export default Emploi


