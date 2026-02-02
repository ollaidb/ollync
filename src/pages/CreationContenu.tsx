import Footer from '../components/Footer'
import CategoryPage from '../components/CategoryPage'
import { useTranslation } from 'react-i18next'

const CreationContenu = () => {
  const { t } = useTranslation(['categories'])
  return (
    <div className="app">
      <CategoryPage
        categorySlug="creation-contenu"
        categoryName={t('categories:titles.creation-contenu')}
      />
      <Footer />
    </div>
  )
}

export default CreationContenu

