import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const PosteService = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage categorySlug="poste-service" categoryName={t('categories:titles.poste-service')} />
      <Footer />
    </div>
  )
}

export default PosteService
