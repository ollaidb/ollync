import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const Vente = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="vente" categoryName={t('categories:titles.vente')} />
      <Footer />
    </div>
  )
}

export default Vente
