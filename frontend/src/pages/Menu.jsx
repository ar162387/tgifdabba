import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { dailyMenuService } from '../services/dailyMenuService';
import { MenuPageSkeleton, MenuItemSkeleton, SectionHeaderSkeleton, CartSkeleton, NavigationSkeleton, PageHeaderSkeleton } from '../components/ui/MenuSkeleton';
import { useBasket } from '../contexts/BasketContext';
import { TIME_CONFIG, getCurrentTime, getMenuDay, isOrderingDisabled } from '../config/timeConfig';
import { validatePostalCode, getDeliveryAreaInfo } from '../services/geocodingService';
import PostalCodeModal from '../components/ui/PostalCodeModal';

const Menu = () => {
  const navigate = useNavigate();
  
  // Time configuration is now imported from global config
  
  // Use basket context instead of local state
  const {
    cart,
    deliveryOption,
    specialRequests,
    currentMenuDay,
    postcode,
    deliveryInfo,
    addToCart,
    removeFromCart,
    setDeliveryOption,
    setSpecialRequests,
    setPostcode,
    setDeliveryInfo,
    getCartTotal,
    getTotalItems,
    getItemQuantity,
    getDeliveryFee,
    getFinalTotal,
    validateCartForMenuDay,
    clearCartIfDifferentDay
  } = useBasket();
  const [currentDay, setCurrentDay] = useState(() => getMenuDay());
  const [activeSection, setActiveSection] = useState('');
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallbackMenu, setIsFallbackMenu] = useState(false);
  const [isOrderingAllowed, setIsOrderingAllowed] = useState(true);
  const [orderingStatusMessage, setOrderingStatusMessage] = useState('');
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [showPostalCodeModal, setShowPostalCodeModal] = useState(false);

  // Get delivery area info
  const deliveryAreaInfo = getDeliveryAreaInfo();

  // Function to check if ordering is currently allowed
  const checkOrderingStatus = () => {
    const { disabled, message } = isOrderingDisabled();
    setIsOrderingAllowed(!disabled);
    setOrderingStatusMessage(message);
  };

  // Handle postal code check using geocoding API
  const checkDelivery = async () => {
    if (!postcode.trim()) {
      alert('Please enter a postal code');
      return;
    }

    setIsCheckingDelivery(true);

    try {
      const result = await validatePostalCode(postcode);
      
      // Store the delivery info in the basket store
      setDeliveryInfo(result);
      
      // Show success/error message
      if (result.inDeliveryRange) {
        console.log('✅ Delivery available:', result);
      } else {
        console.log('❌ Delivery not available:', result);
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryInfo({
        success: false,
        message: 'Error checking delivery availability. Please try again.',
        inDeliveryRange: false
      });
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  // Handle postal code check with specific postcode parameter
  const checkDeliveryWithPostcode = async (specificPostcode) => {
    if (!specificPostcode.trim()) {
      alert('Please enter a postal code');
      return;
    }

    setIsCheckingDelivery(true);

    try {
      const result = await validatePostalCode(specificPostcode);
      
      // Store the delivery info in the basket store
      setDeliveryInfo(result);
      
      // Show success/error message
      if (result.inDeliveryRange) {
        console.log('✅ Delivery available:', result);
      } else {
        console.log('❌ Delivery not available:', result);
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryInfo({
        success: false,
        message: 'Error checking delivery availability. Please try again.',
        inDeliveryRange: false
      });
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  // Handle postal code validation from modal
  const handlePostcodeValidated = (postcodeData) => {
    setPostcode(postcodeData.postcode);
    setDeliveryInfo(postcodeData.deliveryInfo);
    setShowPostalCodeModal(false);
  };

  // Handle checkout with postal code validation
  const handleCheckout = async () => {
    // Check if delivery is selected
    if (deliveryOption === 'delivery') {
      // Check if no postal code is entered
      if (!postcode || !deliveryInfo) {
        setShowPostalCodeModal(true);
        return;
      }
      
      // Re-validate the postal code to ensure it's still valid
      try {
        setIsCheckingDelivery(true);
        const validationResult = await validatePostalCode(postcode);
        
        // Check if the postcode is still valid (success: true and in delivery area)
        if (!validationResult.success || !validationResult.areaCode) {
          // Invalid postcode - show modal to correct it
          setShowPostalCodeModal(true);
          setIsCheckingDelivery(false);
          return;
        }
        
        // Update delivery info with fresh validation
        setDeliveryInfo(validationResult);
        setIsCheckingDelivery(false);
      } catch (error) {
        console.error('Postcode re-validation failed:', error);
        // If validation fails, show modal to correct postcode
        setShowPostalCodeModal(true);
        setIsCheckingDelivery(false);
        return;
      }
    }
    
    // Proceed to checkout
    navigate('/checkout');
  };

  // Check if postal code is required and show modal
  const checkPostalCodeRequirement = () => {
    if (deliveryOption === 'delivery' && (!postcode || !deliveryInfo)) {
      setShowPostalCodeModal(true);
      return false;
    }
    return true;
  };

  // Check ordering status and update menu day on component mount and set up interval
  useEffect(() => {
    const updateStatusAndMenu = () => {
      checkOrderingStatus();
      const newDay = getMenuDay();
      setCurrentDay(newDay);
      
      // Validate cart against current menu day
      if (!validateCartForMenuDay(newDay)) {
        // Cart contains items from different day, clear it
        clearCartIfDifferentDay(newDay);
      }
    };
    
    updateStatusAndMenu();
    
    // Update every minute to keep status current
    const interval = setInterval(updateStatusAndMenu, 60000);
    
    return () => clearInterval(interval);
  }, [validateCartForMenuDay, clearCartIfDifferentDay]);

  // Load menu data from backend
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        let usingFallback = false;
        try {
          // Try to get menu for determined day
          response = await dailyMenuService.getDailyMenuByDay(currentDay);
        } catch (err) {
          // If current day fails, try to get Monday's menu as fallback
          response = await dailyMenuService.getDailyMenuByDay('monday');
          usingFallback = true;
        }
        
        if (response.success && response.data) {
          const dailyMenu = response.data;
          
          // Transform backend data to match frontend structure
          const transformedMenu = {
            sections: dailyMenu.sections || [],
            items: dailyMenu.items || []
          };
          
          setMenuData(transformedMenu);
          setIsFallbackMenu(usingFallback);
          
          // Set first section as active if available
          if (transformedMenu.sections.length > 0) {
            setActiveSection(transformedMenu.sections[0].name);
          }
        } else {
          throw new Error('No menu data available');
        }
      } catch (err) {
        console.error('Error loading menu:', err);
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [currentDay]);

  // Show postal code modal when delivery is selected and no postcode is entered
  // But don't block the user from adding items to cart
  useEffect(() => {
    if (deliveryOption === 'delivery' && (!postcode || !deliveryInfo)) {
      // Only show modal if user hasn't dismissed it recently
      const lastDismissed = localStorage.getItem('postalCodeModalDismissed');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (!lastDismissed || (now - parseInt(lastDismissed)) > oneHour) {
        setShowPostalCodeModal(true);
      }
    }
  }, [deliveryOption, postcode, deliveryInfo]);

  // Delivery timing data
  const deliveryTimings = {
    delivery: {
      eta: "6:00 PM - 8:00 PM",
      windows: [ "6:00 PM - 8:00 PM"],
      fee: 3.0
    },
    collection: {
      eta: "15-20 mins",
      windows: ["11:00 AM - 1:00 PM", "6:00 PM - 8:00 PM"],
      fee: 0
    }
  };

  // Remove the duplicate useEffect that was resetting currentDay
  // useEffect(() => {
  //   const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  //   setCurrentDay(today);
  // }, []);

  // Group menu items by sections
  const groupedMenu = menuData ? menuData.sections.reduce((acc, section) => {
    acc[section.name] = section.itemIds || [];
    return acc;
  }, {}) : {};


  // Intersection Observer to update active section on scroll
  useEffect(() => {
    if (!menuData || !menuData.sections.length) return;
    
    const isMobile = window.innerWidth < 1024;
    
    // Calculate the proper offset for intersection observer
    const stickyNav = document.querySelector('.lg\\:hidden.sticky.top-20');
    const stickyNavHeight = stickyNav ? stickyNav.offsetHeight : 0;
    const topNavHeight = 96; // pt-24 = 96px
    const totalOffset = topNavHeight + stickyNavHeight + 20; // 20px padding
    
    const observerOptions = {
      root: null,
      rootMargin: `-${totalOffset}px 0px -70% 0px`, // Account for sticky nav bar height
      threshold: [0, 0.1, 0.5, 0.9, 1] // Multiple thresholds for better detection
    };

    const observerCallback = (entries) => {
      // Find the section with the highest intersection ratio
      let mostVisibleEntry = null;
      let highestRatio = 0;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          mostVisibleEntry = entry;
        }
      });
      
      if (mostVisibleEntry) {
        const sectionId = mostVisibleEntry.target.id;
        let sectionName;
        
        if (sectionId.startsWith('section-desktop-')) {
          sectionName = sectionId.replace('section-desktop-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else if (sectionId.startsWith('section-mobile-')) {
          sectionName = sectionId.replace('section-mobile-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        setActiveSection(sectionName);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Small delay to ensure DOM elements are fully rendered
    setTimeout(() => {
      // Observe all sections
      menuData.sections.forEach((section) => {
        const desktopElement = document.getElementById(`section-desktop-${section.name.replace(/\s+/g, '-').toLowerCase()}`);
        const mobileElement = document.getElementById(`section-mobile-${section.name.replace(/\s+/g, '-').toLowerCase()}`);
        
        if (desktopElement) {
          observer.observe(desktopElement);
        }
        if (mobileElement) {
          observer.observe(mobileElement);
        }
      });
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, [menuData]);


  const scrollToSection = (sectionName) => {
    setActiveSection(sectionName);
    
    // Find the appropriate section element based on screen size
    const isMobile = window.innerWidth < 1024;
    const prefix = isMobile ? 'section-mobile-' : 'section-desktop-';
    const sectionId = `${prefix}${sectionName.replace(/\s+/g, '-').toLowerCase()}`;
    const element = document.getElementById(sectionId);
    
    if (element) {
      // Calculate offset for sticky navigation
      const stickyNav = document.querySelector('.lg\\:hidden.sticky.top-20');
      const stickyNavHeight = stickyNav ? stickyNav.offsetHeight : 0;
      const topNavHeight = 96; // pt-24 = 96px
      const totalOffset = topNavHeight + stickyNavHeight + 20;
      
      const elementPosition = element.offsetTop - totalOffset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  // Show loading state
  if (loading) {
    return <MenuPageSkeleton isMobile={window.innerWidth < 1024} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-accent-yellow text-charcoal flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
          <p className="text-lg mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="secondary"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show no menu available state
  if (!menuData || menuData.sections.length === 0) {
    return (
      <div className="min-h-screen bg-accent-yellow text-charcoal flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">No Menu Available</h1>
          <p className="text-lg mb-6">Sorry, there's no menu available for {currentDay}.</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="secondary"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        /* Add scroll padding to account for sticky navigation */
        section[id^="section-desktop-"] {
          scroll-margin-top: 120px; /* Adjust this value based on your sticky nav height */
        }
        section[id^="section-mobile-"] {
          scroll-margin-top: 100px; /* Slightly less for mobile */
        }
      `}</style>
      <div className="min-h-screen bg-accent-yellow text-charcoal">
        {/* Header Section */}
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-4">
              {isFallbackMenu ? "Today's Menu" : (currentDay ? `${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}'s Menu` : "Today's Menu")}
            </h1>
            {isFallbackMenu && (
              <p className="text-sm text-charcoal/60 mb-2 italic">
                Showing Monday's menu as today's menu is not available
              </p>
            )}
            <p className="text-lg md:text-xl text-charcoal/80 mb-6">
              Fresh Indian tiffins delivered to your door
            </p>
            
            {/* Ordering Status Message */}
            {!isOrderingAllowed && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <div className="text-center">
                 
                  <p className="text-red-600 text-sm">{orderingStatusMessage}</p>
                </div>
              </div>
            )}

            
            {/* Delivery Options */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
                <button
                  onClick={() => {
                    setDeliveryOption('delivery');
                    if (!postcode || !deliveryInfo) {
                      setShowPostalCodeModal(true);
                    }
                  }}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    deliveryOption === 'delivery'
                      ? 'bg-charcoal text-accent-yellow'
                      : 'text-charcoal hover:bg-white/30'
                  }`}
                >
                  🚚 Delivery
                </button>
                <button
                  onClick={() => setDeliveryOption('collection')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    deliveryOption === 'collection'
                      ? 'bg-charcoal text-accent-yellow'
                      : 'text-charcoal hover:bg-white/30'
                  }`}
                >
                  🏪 Collection
                </button>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="text-center space-y-4">
                {deliveryOption === 'delivery' ? (
                  <div>
                    <p className="text-sm font-medium text-charcoal/70 mb-2">Delivery Areas</p>
                    <p className="text-lg font-bold text-charcoal">
                      BR1 - BR7
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-charcoal/70 mb-2">Collection Time</p>
                    <p className="text-lg font-bold text-charcoal">
                      11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM
                    </p>
                  </div>
                )}
                

                {deliveryOption === 'delivery' && (
                  <div className="pt-4 border-t border-charcoal/20">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <p className="text-sm font-medium text-charcoal/70">Your Location</p>
                      <button
                        onClick={() => setShowPostalCodeModal(true)}
                        className="text-xs bg-charcoal text-accent-yellow px-2 py-1 rounded-full hover:bg-charcoal/90 transition-colors"
                      >
                        {postcode ? 'Change' : 'Set Location'}
                      </button>
                    </div>
                    {postcode && deliveryInfo ? (
                      <>
                        <p className="text-lg font-bold text-charcoal mb-2">{postcode}</p>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          deliveryInfo.inDeliveryRange 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {deliveryInfo.inDeliveryRange ? '✓ Delivery Available' : 'ℹ️ Delivery Available'}
                        </div>
                        {deliveryInfo.distance && (
                          <p className="text-sm text-charcoal/70 mt-1">
                            Distance: {deliveryInfo.distance.toFixed(1)} miles
                          </p>
                        )}
                        
                        {/* Dynamic delivery message */}
                        <div className="mt-2">
                          {deliveryInfo.inDeliveryRange ? (
                            <p className="text-sm text-green-700 font-medium">
                              You have got a free delivery
                            </p>
                          ) : (
                            <p className="text-sm text-blue-700 font-medium">
                              £30 order for free delivery
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-charcoal/70 italic">
                          Click "Set Location" to check delivery availability
                        </p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 font-medium">
                            Postal code not selected
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* Desktop Section Navigation */}
          <div className="hidden lg:block sticky top-20 z-10 bg-accent-yellow/95 backdrop-blur-sm border-b-2 border-charcoal/20 mb-8">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
                  {menuData.sections.map((section) => (
                    <a
                      key={section.name}
                      href={`#section-desktop-${section.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => scrollToSection(section.name)}
                      className={`px-6 py-3 rounded-full font-medium transition-all ${
                        activeSection === section.name
                          ? 'bg-charcoal text-accent-yellow'
                          : 'text-charcoal hover:bg-white/30'
                      }`}
                    >
                      {section.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Section Navigation */}
          <div className="lg:hidden sticky top-20 z-20 bg-accent-yellow/95 backdrop-blur-sm border-b-2 border-charcoal/20 mb-6" style={{ position: 'sticky', top: '80px' }}>
            <div className="px-6 py-3">
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
                  {menuData.sections.map((section) => (
                    <a
                      key={section.name}
                      href={`#section-mobile-${section.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => scrollToSection(section.name)}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        activeSection === section.name
                          ? 'bg-charcoal text-accent-yellow'
                          : 'text-charcoal hover:bg-white/30'
                      }`}
                    >
                      {section.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex gap-8">
            {/* Menu Items */}
            <div className="flex-1">
              {menuData.sections.map((section) => (
                <section 
                  key={section.name} 
                  id={`section-desktop-${section.name.replace(/\s+/g, '-').toLowerCase()}`}
                  className="mb-12 pt-4"
                >
                  <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 border-b-2 border-charcoal pb-2">
                    {section.name}
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {section.itemIds.filter(item => item.active !== false).map((item) => (
                      <div key={item._id} className="bg-white/20 backdrop-blur-sm rounded-lg p-6 flex gap-6">
                        {item.imageUrl || item.image ? (
                          <img
                            src={item.imageUrl || item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-24 h-24 bg-charcoal/10 rounded-lg flex items-center justify-center text-center text-xs font-medium text-charcoal/80 p-2"
                          style={{ display: item.imageUrl || item.image ? 'none' : 'flex' }}
                        >
                          {item.name}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                          <p className="text-charcoal/80 mb-3">{item.description}</p>
                          <div className="mb-3">
                            <p className="text-sm font-medium text-charcoal/70 mb-1">Allergens:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.allergens && item.allergens.map((allergen, index) => (
                                <span
                                  key={index}
                                  className="bg-white/30 text-xs px-2 py-1 rounded-full"
                                >
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary-orange">
                              £{item.price.toFixed(2)}
                            </span>
                            {getItemQuantity(item._id) === 0 ? (
                              <Button
                                onClick={() => addToCart(item, currentDay)}
                                variant="secondary"
                                size="small"
                                disabled={!isOrderingAllowed}
                                className={!isOrderingAllowed ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                {!isOrderingAllowed ? 'Ordering Disabled' : 'Add to Basket'}
                              </Button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-8 h-8 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-lg font-bold hover:bg-charcoal/90 transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold text-lg">
                                  {getItemQuantity(item._id)}
                                </span>
                                <button
                                  onClick={() => addToCart(item, currentDay)}
                                  disabled={!isOrderingAllowed}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                                    !isOrderingAllowed 
                                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                      : 'bg-charcoal text-accent-yellow hover:bg-charcoal/90'
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Cart Sidebar */}
            <div className="w-80 bg-white/20 backdrop-blur-sm rounded-lg p-6 h-fit sticky top-32">
              <h3 className="text-xl font-bold mb-4">Your Basket</h3>
              
              {cart.length === 0 ? (
                <p className="text-charcoal/70 text-center py-8">Your basket is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item._id} className="flex items-center justify-between bg-white/30 rounded-lg p-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-charcoal/70">£{item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="w-6 h-6 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>£{getCartTotal().toFixed(2)}</span>
                    </div>
                    {deliveryOption === 'delivery' && (
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <span className={getDeliveryFee() === 0 ? 'text-green-600 font-medium' : ''}>
                          {getDeliveryFee() === 0 ? 'FREE' : `£${getDeliveryFee().toFixed(2)}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-charcoal/30 pt-2">
                      <span>Total:</span>
                      <span>£{getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Special Requests</label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special instructions..."
                      className="w-full bg-white/50 border border-charcoal/30 rounded-lg px-3 py-2 text-sm resize-none"
                      rows="3"
                    />
                  </div>

                  <Button
                    onClick={handleCheckout}
                    variant="secondary"
                    className="w-full"
                    disabled={!isOrderingAllowed || isCheckingDelivery}
                  >
                    {!isOrderingAllowed ? 'Ordering Disabled' : isCheckingDelivery ? 'Validating...' : 'Proceed to Checkout'}
                  </Button>

                  {deliveryOption === 'delivery' && deliveryInfo && !deliveryInfo.inDeliveryRange && getCartTotal() < deliveryAreaInfo.freeDeliveryThreshold && (
                    <p className="text-xs text-center mt-2 text-charcoal/70">
                      Spend £{(deliveryAreaInfo.freeDeliveryThreshold - getCartTotal()).toFixed(2)} more for free delivery!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            {menuData.sections.map((section) => (
              <section 
                key={section.name} 
                id={`section-mobile-${section.name.replace(/\s+/g, '-').toLowerCase()}`}
                className="mb-8 pt-4"
              >
                <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-charcoal pb-2">
                  {section.name}
                </h2>
                <div className="space-y-4">
                  {section.itemIds.filter(item => item.active !== false).map((item) => (
                    <div key={item._id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      {item.imageUrl || item.image ? (
                        <img
                          src={item.imageUrl || item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-32 bg-charcoal/10 rounded-lg flex items-center justify-center text-center text-sm font-medium text-charcoal/80 p-4 mb-3"
                        style={{ display: item.imageUrl || item.image ? 'none' : 'flex' }}
                      >
                        {item.name}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                      <p className="text-charcoal/80 text-sm mb-3">{item.description}</p>
                      <div className="mb-3">
                        <p className="text-xs font-medium text-charcoal/70 mb-1">Allergens:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.allergens && item.allergens.map((allergen, index) => (
                            <span
                              key={index}
                              className="bg-white/30 text-xs px-2 py-1 rounded-full"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-orange">
                          £{item.price.toFixed(2)}
                        </span>
                        {getItemQuantity(item._id) === 0 ? (
                          <Button
                            onClick={() => addToCart(item, currentDay)}
                            variant="secondary"
                            size="small"
                            disabled={!isOrderingAllowed}
                            className={!isOrderingAllowed ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            {!isOrderingAllowed ? 'Ordering Disabled' : 'Add to Basket'}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="w-8 h-8 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-lg font-bold hover:bg-charcoal/90 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-lg">
                              {getItemQuantity(item._id)}
                            </span>
                            <button
                              onClick={() => addToCart(item, currentDay)}
                              disabled={!isOrderingAllowed}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                                !isOrderingAllowed 
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                  : 'bg-charcoal text-accent-yellow hover:bg-charcoal/90'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Checkout Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-accent-yellow border-t-2 border-charcoal p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{getTotalItems()} items</p>
              <p className="text-sm text-charcoal/70">
                {deliveryOption === 'delivery' ? 'Delivery' : 'Collection'} • {deliveryTimings[deliveryOption].eta}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-charcoal/70">Total</p>
              <p className="font-bold text-xl">£{getFinalTotal().toFixed(2)}</p>
            </div>
            <Button
              onClick={handleCheckout}
              variant="secondary"
              size="default"
              disabled={!isOrderingAllowed || isCheckingDelivery}
            >
              {!isOrderingAllowed ? 'Disabled' : isCheckingDelivery ? 'Validating...' : 'Checkout'}
            </Button>
          </div>
        </div>
      )}

      {/* Postal Code Modal */}
      <PostalCodeModal
        isOpen={showPostalCodeModal}
        onClose={() => setShowPostalCodeModal(false)}
        onPostcodeValidated={handlePostcodeValidated}
        currentPostcode={postcode}
      />
      </div>
    </>
  );
};

export default Menu;
