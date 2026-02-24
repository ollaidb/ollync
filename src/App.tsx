import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import Footer from './components/Footer'
const Home = lazy(() => import('./pages/Home'))
const Feed = lazy(() => import('./pages/Feed'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Publish = lazy(() => import('./pages/Publish'))
const Messages = lazy(() => import('./pages/Messages'))
const Profile = lazy(() => import('./pages/Profile'))
const CreationContenu = lazy(() => import('./pages/CreationContenu'))
const Emploi = lazy(() => import('./pages/Emploi'))
const CastingRole = lazy(() => import('./pages/CastingRole'))
const StudioLieu = lazy(() => import('./pages/StudioLieu'))
const Service = lazy(() => import('./pages/Service'))
const Evenements = lazy(() => import('./pages/Evenements'))
const Vente = lazy(() => import('./pages/Vente'))
const PostDetails = lazy(() => import('./pages/PostDetails'))
const PostRecommendations = lazy(() => import('./pages/PostRecommendations'))
const SwipePage = lazy(() => import('./pages/SwipePage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const Search = lazy(() => import('./pages/Search'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Moderation = lazy(() => import('./pages/Moderation'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const UrgentPosts = lazy(() => import('./pages/UrgentPosts'))
const RecentPosts = lazy(() => import('./pages/RecentPosts'))
import { ToastProvider } from './contexts/ToastContext'
import { NavigationHistoryProvider } from './contexts/NavigationHistoryContext'
import { useIsMobile } from './hooks/useIsMobile'
import { useConsent } from './hooks/useConsent'
import WebLayout from './layouts/WebLayout'
import ConsentModal from './components/ConsentModal'
import './App.css'

function AppContent() {
  const location = useLocation()
  const routeTransitionKey = `${location.pathname}${location.search}`
  const isAuthPage = location.pathname.startsWith('/auth/')
  const isMobile = useIsMobile()
  const isConsentInfoPage =
    location.pathname === '/profile/legal/politique-cookies' ||
    location.pathname === '/profile/legal/politique-confidentialite'
  const showFooter = !isAuthPage && !location.pathname.startsWith('/messages/') && location.pathname !== '/notifications' && !location.pathname.startsWith('/post/') && location.pathname !== '/publish' && location.pathname !== '/publier-annonce' && !location.pathname.startsWith('/profile/')
  const cookiesConsent = useConsent('cookies')

  useEffect(() => {
    if (isConsentInfoPage) return
    if (cookiesConsent.loading) return
    if (!cookiesConsent.canPromptNow) return
    if (cookiesConsent.showModal) return
    if (cookiesConsent.hasConsented === true) return
    cookiesConsent.requireConsent(() => {})
  }, [
    cookiesConsent.canPromptNow,
    cookiesConsent.hasConsented,
    cookiesConsent.loading,
    cookiesConsent.showModal,
    cookiesConsent.requireConsent,
    isConsentInfoPage
  ])

  const routes = (
    <Suspense
      fallback={
        <div className="route-loading">
          <div className="route-loading-spinner" />
          <div className="route-loading-text">Chargement...</div>
        </div>
      }
    >
      <Routes key={routeTransitionKey}>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/likes" element={<Favorites />} />
      <Route path="/publish" element={<Publish />} />
      <Route path="/publier-annonce" element={<Publish />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:id" element={<Messages />} />
      <Route path="/messages/:id/info" element={<Messages />} />
      <Route path="/messages/:id/media" element={<Messages />} />
      <Route path="/messages/:id/appointments" element={<Messages />} />
      <Route path="/messages/:id/contracts" element={<Messages />} />
      <Route path="/messages/:id/posts" element={<Messages />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/public" element={<Profile />} />
      <Route path="/profile/public/:id" element={<Profile />} />
      <Route path="/profile/edit" element={<Profile />} />
      <Route path="/profile/settings" element={<Profile />} />
      <Route path="/profile/settings/personal-info" element={<Profile />} />
      <Route path="/profile/settings/mail" element={<Profile />} />
      <Route path="/profile/settings/online-status" element={<Profile />} />
      <Route path="/profile/settings/payment" element={<Profile />} />
      <Route path="/profile/settings/appearance" element={<Profile />} />
      <Route path="/profile/settings/notifications" element={<Profile />} />
      <Route path="/profile/settings/language" element={<Profile />} />
      <Route path="/profile/settings/data-management" element={<Profile />} />
      <Route path="/profile/settings/delete-account" element={<Profile />} />
      <Route path="/profile/security" element={<Profile />} />
      <Route path="/profile/security/account-security" element={<Profile />} />
      <Route path="/profile/security/password" element={<Profile />} />
      <Route path="/profile/security/phone" element={<Profile />} />
      <Route path="/profile/security/two-factor" element={<Profile />} />
      <Route path="/profile/security/devices" element={<Profile />} />
      <Route path="/profile/security/blocked-profiles" element={<Profile />} />
      <Route path="/profile/security/moderation" element={<Profile />} />
      <Route path="/profile/help" element={<Profile />} />
      <Route path="/profile/contact" element={<Profile />} />
      <Route path="/profile/resources" element={<Profile />} />
      <Route path="/profile/resources/creation-entreprise" element={<Profile />} />
      <Route path="/profile/resources/declaration-revenus" element={<Profile />} />
      <Route path="/profile/legal" element={<Profile />} />
      <Route path="/profile/legal/mentions-legales" element={<Profile />} />
      <Route path="/profile/legal/politique-confidentialite" element={<Profile />} />
      <Route path="/profile/legal/cgu" element={<Profile />} />
      <Route path="/profile/legal/cgv" element={<Profile />} />
      <Route path="/profile/legal/politique-cookies" element={<Profile />} />
      <Route path="/profile/legal/securite" element={<Profile />} />
      <Route path="/profile/annonces" element={<Profile />} />
      <Route path="/profile/contracts" element={<Profile />} />
      <Route path="/profile/wallet" element={<Profile />} />
      <Route path="/profile/transactions" element={<Profile />} />
      <Route path="/profile/tickets" element={<Profile />} />
      <Route path="/profile/candidature" element={<Profile />} />
      <Route path="/profile/espace-candidat" element={<Profile />} />
      <Route path="/profile/:id" element={<Profile />} />
      {/* Nouvelles routes - Catégories principales */}
      <Route path="/creation-contenu" element={<CreationContenu />} />
      <Route path="/creation-contenu/:submenu" element={<CreationContenu />} />
      <Route path="/creation-contenu/:submenu/:subSubMenu" element={<CreationContenu />} />
      <Route path="/creation-contenu/:submenu/:subSubMenu/:subSubSubMenu" element={<CreationContenu />} />
      <Route path="/emploi" element={<Emploi />} />
      <Route path="/emploi/:submenu" element={<Emploi />} />
      <Route path="/emploi/:submenu/:subSubMenu" element={<Emploi />} />
      <Route path="/emploi/:submenu/:subSubMenu/:subSubSubMenu" element={<Emploi />} />
      <Route path="/studio-lieu" element={<StudioLieu />} />
      <Route path="/studio-lieu/:submenu" element={<StudioLieu />} />
      <Route path="/studio-lieu/:submenu/:subSubMenu" element={<StudioLieu />} />
      <Route path="/studio-lieu/:submenu/:subSubMenu/:subSubSubMenu" element={<StudioLieu />} />
      <Route path="/casting-role" element={<CastingRole />} />
      <Route path="/casting-role/:submenu" element={<CastingRole />} />
      <Route path="/casting-role/:submenu/:subSubMenu" element={<CastingRole />} />
      <Route path="/casting-role/:submenu/:subSubMenu/:subSubSubMenu" element={<CastingRole />} />
      <Route path="/services" element={<Service />} />
      <Route path="/services/:submenu" element={<Service />} />
      <Route path="/services/:submenu/:subSubMenu" element={<Service />} />
      <Route path="/services/:submenu/:subSubMenu/:subSubSubMenu" element={<Service />} />
      <Route path="/evenements" element={<Evenements />} />
      <Route path="/evenements/:submenu" element={<Evenements />} />
      <Route path="/evenements/:submenu/:subSubMenu" element={<Evenements />} />
      <Route path="/evenements/:submenu/:subSubMenu/:subSubSubMenu" element={<Evenements />} />
      <Route path="/vente" element={<Vente />} />
      <Route path="/vente/:submenu" element={<Vente />} />
      <Route path="/vente/:submenu/:subSubMenu" element={<Vente />} />
      <Route path="/vente/:submenu/:subSubMenu/:subSubSubMenu" element={<Vente />} />
      <Route path="/publier-annonce" element={<Publish />} />
      <Route path="/post/:id" element={<PostDetails />} />
      <Route path="/post/:id/recommendations" element={<PostRecommendations />} />
      <Route path="/swipe" element={<SwipePage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/search" element={<Search />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/moderation" element={<Moderation />} />
      <Route path="/urgent" element={<UrgentPosts />} />
      <Route path="/recent" element={<RecentPosts />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      </Routes>
    </Suspense>
  )

  return (
    <NavigationHistoryProvider>
      <ToastProvider>
        <ConsentModal
          visible={cookiesConsent.showModal && !isConsentInfoPage}
          title={cookiesConsent.messages.title}
          message={cookiesConsent.messages.message}
          onAccept={cookiesConsent.handleAccept}
          onReject={cookiesConsent.handleReject}
          onLearnMore={cookiesConsent.dismissModal}
          learnMoreHref="/profile/legal/politique-cookies"
          askAgainChecked={cookiesConsent.askAgainNextTime}
          onAskAgainChange={cookiesConsent.setAskAgainNextTime}
        />
        <div className={`app ${isMobile ? 'app--mobile' : 'app--web'}`} data-platform={isMobile ? 'mobile' : 'web'}>
          <a href="#main-content" className="skip-link">Aller au contenu principal</a>
          {isMobile ? (
            <>
              <main id="main-content" className="main-content without-header" tabIndex={-1}>
                <div key={routeTransitionKey} className="route-transition-shell">
                  {routes}
                </div>
              </main>
              {showFooter && <Footer />}
            </>
          ) : (
            <WebLayout>
              <main id="main-content" className="main-content without-header" tabIndex={-1}>
                <div key={routeTransitionKey} className="route-transition-shell">
                  {routes}
                </div>
              </main>
              {showFooter && <Footer />}
            </WebLayout>
          )}
        </div>
      </ToastProvider>
    </NavigationHistoryProvider>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
