import React, { useState } from 'react';

const TopNav = ({ onNavigate, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const isMenuPage = currentPage === 'menu';
  const isAboutPage = currentPage === 'about';
  const navBgColor = isMobileMenuOpen ? 'bg-accent-yellow' : (isMenuPage ? 'bg-accent-yellow' : 'bg-transparent');
  const textColor = isMenuPage ? 'text-charcoal' : 'text-accent-yellow';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 py-6 transition-all duration-300 ${navBgColor}`}>
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex justify-between items-center">
            {/* Left wordmark - Desktop */}
            <button 
              onClick={() => handleNavigation('home')}
              className={`font-bold text-3xl uppercase tracking-tight hidden md:block transition-colors duration-300 ${textColor} hover:opacity-80`}
            >
              TGIF DABBA
            </button>
            
            {/* Left wordmark - Mobile */}
            <button 
              onClick={() => handleNavigation('home')}
              className={`font-bold text-2xl uppercase tracking-tight md:hidden transition-colors duration-300 ${
                isMobileMenuOpen ? 'text-charcoal' : textColor
              } hover:opacity-80`}
            >
              TGIF DABBA
            </button>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex items-center space-x-10">
              <button 
                onClick={() => handleNavigation('menu')}
                className={`${textColor} uppercase text-base font-medium tracking-wide hover:underline decoration-2 underline-offset-4 transition-all`}
              >
                MENU
              </button>
              <button 
                onClick={() => handleNavigation('about')}
                className={`${textColor} uppercase text-base font-medium tracking-wide hover:underline decoration-2 underline-offset-4 transition-all`}
              >
                ABOUT US
              </button>
              <button 
                onClick={() => handleNavigation('contact')}
                className={`${textColor} uppercase text-base font-medium tracking-wide hover:underline decoration-2 underline-offset-4 transition-all`}
              >
                CONTACT US
              </button>
              <div className="flex items-center space-x-2">
                <span className={`${textColor} uppercase text-base font-medium tracking-wide`}>BASKET</span>
                <span className={`${isMenuPage ? 'bg-charcoal text-accent-yellow' : 'bg-white text-primary-orange'} rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors duration-300`}>
                  9
                </span>
              </div>
            </div>
            
            {/* Mobile navigation - + icon and cart count */}
            <div className="flex items-center space-x-3 md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className={`text-2xl font-bold transition-all duration-300 ${
                  isMobileMenuOpen ? 'text-charcoal' : textColor
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
              <div className="flex items-center space-x-2">
                <span className={`rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                  isMobileMenuOpen ? 'bg-charcoal text-accent-yellow' : (isMenuPage ? 'bg-charcoal text-accent-yellow' : 'bg-white text-primary-orange')
                }`}>
                  {isMobileMenuOpen ? '0' : '4'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-accent-yellow transition-all duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <button 
            onClick={() => handleNavigation('menu')}
            className="text-charcoal text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            MENU
          </button>
          <button 
            onClick={() => handleNavigation('about')}
            className="text-charcoal text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            ABOUT US
          </button>
          <button 
            onClick={() => handleNavigation('contact')}
            className="text-charcoal text-2xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            CONTACT US
          </button>
        </div>
      </div>
    </>
  );
};

export default TopNav;
