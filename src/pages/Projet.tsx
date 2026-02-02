import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const Projet = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="projet" categoryName={t('categories:titles.projets-equipe')} />
      <Footer />
    </div>
  )
}

export default Projet
