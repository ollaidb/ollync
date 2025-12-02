import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Footer from './components/Footer'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Favorites from './pages/Favorites'
import Publish from './pages/Publish'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Match from './pages/Match'
import Recrutement from './pages/Recrutement'
import Projet from './pages/Projet'
import Service from './pages/Service'
import Vente from './pages/Vente'
import Mission from './pages/Mission'
import Autre from './pages/Autre'
import PostDetails from './pages/PostDetails'
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
          <Route path="/match" element={<Match />} />
          <Route path="/match/:submenu" element={<Match />} />
          <Route path="/match/:submenu/:subSubMenu" element={<Match />} />
          <Route path="/recrutement" element={<Recrutement />} />
          <Route path="/recrutement/:submenu" element={<Recrutement />} />
          <Route path="/recrutement/:submenu/:subSubMenu" element={<Recrutement />} />
          <Route path="/projet" element={<Projet />} />
          <Route path="/projet/:submenu" element={<Projet />} />
          <Route path="/projet/:submenu/:subSubMenu" element={<Projet />} />
          <Route path="/service" element={<Service />} />
          <Route path="/service/:submenu" element={<Service />} />
          <Route path="/service/:submenu/:subSubMenu" element={<Service />} />
          <Route path="/vente" element={<Vente />} />
          <Route path="/vente/:submenu" element={<Vente />} />
          <Route path="/vente/:submenu/:subSubMenu" element={<Vente />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/mission/:submenu" element={<Mission />} />
          <Route path="/mission/:submenu/:subSubMenu" element={<Mission />} />
          <Route path="/autre" element={<Autre />} />
          <Route path="/autre/:submenu" element={<Autre />} />
          <Route path="/autre/:submenu/:subSubMenu" element={<Autre />} />
          <Route path="/publier-annonce" element={<Publish />} />
          <Route path="/post/:id" element={<PostDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
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

