import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import Publish from './pages/Publish'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Menu from './pages/Menu'
import Match from './pages/Match'
import Service from './pages/Service'
import Vente from './pages/Vente'
import Mission from './pages/Mission'
import Autre from './pages/Autre'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className="app">
      {isHomePage && <Header />}
      <main className={`main-content ${isHomePage ? 'with-header' : 'without-header'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/match" element={<Match />} />
          <Route path="/service" element={<Service />} />
          <Route path="/vente" element={<Vente />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/autre" element={<Autre />} />
        </Routes>
      </main>
      <Footer />
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

