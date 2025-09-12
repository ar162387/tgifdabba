import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import Footer from './components/Footer'
import ClosingBanner from './components/ClosingBanner'
import CMSApp from './cms/App'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <Menu />
      case 'about':
        return <About />
      case 'home':
      default:
        return <Home />
    }
  }

  // Check if we're on a CMS route
  const isCMSRoute = window.location.pathname.startsWith('/cms')

  if (isCMSRoute) {
    return <CMSApp />
  }

  return (
    <Router>
      <Routes>
        <Route path="/*" element={
          <div className="min-h-screen font-sans text-charcoal bg-soft-white">
            <TopNav onNavigate={setCurrentPage} currentPage={currentPage} />
            {renderPage()}
            <Footer />
            <ClosingBanner />
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App