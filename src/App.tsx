import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Footer from './components/Footer'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Favorites from './pages/Favorites'
import Publish from './pages/Publish'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import CreationContenu from './pages/CreationContenu'
import Montage from './pages/Montage'
import CastingRole from './pages/CastingRole'
import ProjetsEquipe from './pages/ProjetsEquipe'
import Service from './pages/Service'
import Vente from './pages/Vente'
import PostDetails from './pages/PostDetails'
import SwipePage from './pages/SwipePage'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isAuthPage = location.pathname.startsWith('/auth/')

  return (
    <div className="app">
      <main className={`main-content without-header`}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/likes" element={<Favorites />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/publier-annonce" element={<Publish />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/public" element={<Profile />} />
          <Route path="/profile/public/:id" element={<Profile />} />
          <Route path="/profile/edit" element={<Profile />} />
          <Route path="/profile/settings" element={<Profile />} />
          <Route path="/profile/settings/personal-info" element={<Profile />} />
          <Route path="/profile/settings/payment" element={<Profile />} />
          <Route path="/profile/settings/appearance" element={<Profile />} />
          <Route path="/profile/settings/notifications" element={<Profile />} />
          <Route path="/profile/security" element={<Profile />} />
          <Route path="/profile/security/account-security" element={<Profile />} />
          <Route path="/profile/security/password" element={<Profile />} />
          <Route path="/profile/help" element={<Profile />} />
          <Route path="/profile/legal" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          {/* Nouvelles routes - Catégories principales */}
          <Route path="/creation-contenu" element={<CreationContenu />} />
          <Route path="/creation-contenu/:submenu" element={<CreationContenu />} />
          <Route path="/creation-contenu/:submenu/:subSubMenu" element={<CreationContenu />} />
          <Route path="/creation-contenu/:submenu/:subSubMenu/:subSubSubMenu" element={<CreationContenu />} />
          <Route path="/montage" element={<Montage />} />
          <Route path="/montage/:submenu" element={<Montage />} />
          <Route path="/montage/:submenu/:subSubMenu" element={<Montage />} />
          <Route path="/montage/:submenu/:subSubMenu/:subSubSubMenu" element={<Montage />} />
          <Route path="/casting-role" element={<CastingRole />} />
          <Route path="/casting-role/:submenu" element={<CastingRole />} />
          <Route path="/casting-role/:submenu/:subSubMenu" element={<CastingRole />} />
          <Route path="/casting-role/:submenu/:subSubMenu/:subSubSubMenu" element={<CastingRole />} />
          <Route path="/projets-equipe" element={<ProjetsEquipe />} />
          <Route path="/projets-equipe/:submenu" element={<ProjetsEquipe />} />
          <Route path="/projets-equipe/:submenu/:subSubMenu" element={<ProjetsEquipe />} />
          <Route path="/projets-equipe/:submenu/:subSubMenu/:subSubSubMenu" element={<ProjetsEquipe />} />
          <Route path="/services" element={<Service />} />
          <Route path="/services/:submenu" element={<Service />} />
          <Route path="/services/:submenu/:subSubMenu" element={<Service />} />
          <Route path="/services/:submenu/:subSubMenu/:subSubSubMenu" element={<Service />} />
          <Route path="/vente" element={<Vente />} />
          <Route path="/vente/:submenu" element={<Vente />} />
          <Route path="/vente/:submenu/:subSubMenu" element={<Vente />} />
          <Route path="/vente/:submenu/:subSubMenu/:subSubSubMenu" element={<Vente />} />
          <Route path="/publier-annonce" element={<Publish />} />
          <Route path="/post/:id" element={<PostDetails />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
        </Routes>
      </main>
      {!isAuthPage && !location.pathname.startsWith('/messages/') && <Footer />}
    </div>
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

