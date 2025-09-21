import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBasket } from '../contexts/BasketContext';
import { isOrderingDisabled } from '../config/timeConfig';

const TopNav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOrderingDisabledModal, setShowOrderingDisabledModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useBasket();

  // Check if ordering is currently disabled using global config
  const checkOrderingStatus = () => {
    const { disabled } = isOrderingDisabled();
    return disabled;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = () => {
    setIsMobileMenuOpen(false);
  };

  const handleBasketClick = () => {
    setIsMobileMenuOpen(false);
    
    // Check if ordering is disabled
    if (checkOrderingStatus()) {
      setShowOrderingDisabledModal(true);
      return;
    }
    
    navigate('/basket');
  };

  const isMenuPage = location.pathname === '/menu';
  const isAboutPage = location.pathname === '/about';
  const isBasketPage = location.pathname === '/basket';
  const navBgColor = isMobileMenuOpen ? 'bg-primary-orange' : (isMenuPage ? 'bg-primary-orange' : 'bg-transparent');
  const textColor = isBasketPage ? 'text-black' : 'text-accent-yellow';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 py-6 transition-all duration-300 ${navBgColor}`}>
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex justify-between items-center">
            {/* Left wordmark - Desktop */}
            <Link 
              to="/"
              onClick={handleNavigation}
              className={`font-bold text-3xl uppercase tracking-tight hidden md:block transition-colors duration-300 ${textColor} hover:opacity-80`}
            >
              TGIF DABBA
            </Link>
            
            {/* Left wordmark - Mobile */}
            <Link 
              to="/"
              onClick={handleNavigation}
              className={`font-bold text-2xl uppercase tracking-tight md:hidden transition-colors duration-300 ${
                isMobileMenuOpen ? 'text-accent-yellow' : textColor
              } hover:opacity-80`}
            >
              TGIF DABBA
            </Link>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex items-center space-x-10">
              <Link 
                to="/menu"
                onClick={handleNavigation}
                className={`${textColor} uppercase text-base font-medium tracking-wide hover:underline decoration-2 underline-offset-4 transition-all`}
              >
                MENU
              </Link>
              <Link 
                to="/about"
                onClick={handleNavigation}
                className={`${textColor} uppercase text-base font-medium tracking-wide hover:underline decoration-2 underline-offset-4 transition-all`}
              >
                ABOUT US
              </Link>
              <Link 
                to="/contact"
                onClick={handleNavigation}
                className={`${textColor} uppercase text-base font-medium tracking-wide hover:underline decoration-2 underline-offset-4 transition-all`}
              >
                CONTACT US
              </Link>
              <button 
                onClick={handleBasketClick}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <span className={`${textColor} uppercase text-base font-medium tracking-wide`}>BASKET</span>
                <span className={`${isBasketPage ? 'bg-black text-white' : (isMenuPage ? 'bg-accent-yellow text-primary-orange' : 'bg-white text-primary-orange')} rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors duration-300`}>
                  {getTotalItems()}
                </span>
              </button>
            </div>
            
            {/* Mobile navigation - + icon and cart count */}
            <div className="flex items-center space-x-3 md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className={`text-2xl font-bold transition-all duration-300 ${
                  isMobileMenuOpen ? 'text-accent-yellow' : textColor
                }`}
              >
                <div className="relative w-6 h-6">
                  <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isMobileMenuOpen ? 'rotate-45' : 'rotate-0'
                  }`}>
                    +
                  </span>
                  <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isMobileMenuOpen ? 'rotate-45' : 'rotate-0'
                  }`}>
                    +
                  </span>
                </div>
              </button>
              <button 
                onClick={handleBasketClick}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <span className={`rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                  isMobileMenuOpen ? 'bg-accent-yellow text-primary-orange' : (isBasketPage ? 'bg-black text-white' : (isMenuPage ? 'bg-accent-yellow text-primary-orange' : 'bg-white text-primary-orange'))
                }`}>
                  {getTotalItems()}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-primary-orange transition-all duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <Link 
            to="/menu"
            onClick={handleNavigation}
            className="text-accent-yellow text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            MENU
          </Link>
          <Link 
            to="/about"
            onClick={handleNavigation}
            className="text-accent-yellow text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            ABOUT US
          </Link>
          <Link 
            to="/contact"
            onClick={handleNavigation}
            className="text-accent-yellow text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            CONTACT US
          </Link>
          <button 
            onClick={handleBasketClick}
            className={`${isBasketPage ? 'text-black' : 'text-accent-yellow'} text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity flex items-center space-x-3`}
          >
            BASKET
            <span className={`${isBasketPage ? 'bg-black text-white' : 'bg-accent-yellow text-primary-orange'} rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`}>
              {getTotalItems()}
            </span>
          </button>
        </div>
      </div>

      {/* Ordering Disabled Modal */}
      {showOrderingDisabledModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ordering Temporarily Disabled</h3>
              <p className="text-gray-600 mb-4">
                Orders are currently disabled. Please try again later.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Ordering will resume at 2:00 PM (UK time)
              </p>
              <button
                onClick={() => setShowOrderingDisabledModal(false)}
                className="bg-primary-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-orange/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
