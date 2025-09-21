import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import ContactUs from './pages/ContactUs'
import Basket from './pages/Basket'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Footer from './components/Footer'
import ClosingBanner from './components/ClosingBanner'
import CMSApp from './cms/App'
import { BasketProvider } from './contexts/BasketContext'

function AppContent() {
  const location = useLocation()

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <div className="min-h-screen font-sans text-charcoal bg-soft-white">
          <TopNav />
          <Home />
          <Footer />
          <ClosingBanner />
        </div>
      } />
      <Route path="/menu" element={
        <div className="min-h-screen font-sans text-charcoal bg-soft-white">
          <TopNav />
          <Menu />
          <Footer />
          <ClosingBanner />
        </div>
      } />
      <Route path="/about" element={
        <div className="min-h-screen font-sans text-charcoal bg-soft-white">
          <TopNav />
          <About />
          <Footer />
          <ClosingBanner />
        </div>
      } />
      <Route path="/contact" element={
        <div className="min-h-screen font-sans text-charcoal bg-soft-white">
          <TopNav />
          <ContactUs />
          <Footer />
          <ClosingBanner />
        </div>
      } />
      <Route path="/basket" element={
        <div className="min-h-screen font-sans text-black bg-white">
          <TopNav />
          <Basket />
          <Footer />
          <ClosingBanner />
        </div>
      } />
      <Route path="/checkout" element={
        <div className="min-h-screen font-sans text-black bg-light-grey">
          <Checkout />
        </div>
      } />
      <Route path="/order-confirmation" element={
        <div className="min-h-screen font-sans text-black bg-light-grey">
          <OrderConfirmation />
        </div>
      } />
      
      {/* CMS routes */}
      <Route path="/cms/*" element={<CMSApp />} />
      
      {/* Catch all route */}
      <Route path="*" element={
        <div className="min-h-screen font-sans text-charcoal bg-soft-white">
          <TopNav />
          <Home />
          <Footer />
          <ClosingBanner />
        </div>
      } />
    </Routes>
  )
}

function App() {
  return (
    <BasketProvider>
      <Router>
        <AppContent />
      </Router>
    </BasketProvider>
  )
}

export default App
