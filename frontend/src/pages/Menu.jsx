import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';

const Menu = () => {
  const [cart, setCart] = useState([]);
  const [deliveryOption, setDeliveryOption] = useState('delivery');
  const [specialRequests, setSpecialRequests] = useState('');
  const [currentDay, setCurrentDay] = useState('');

  // Dynamic menu data based on day of week
  const menuData = {
    monday: [
      {
        id: 1,
        name: "Tiffin 1",
        description: "Palakh paneer curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Chapati 6",
        allergens: ["Gluten", "Milk (Ghee, Butter, Yogurt)", "Mustard", "Red Chilli Powder", "Sunflower Oil", "Tree Nuts"],
        price: 9.99,
        image: "/images/food-image-sizzle.png",
        category: "Main Tiffin"
      },
      {
        id: 2,
        name: "Tiffin 2",
        description: "Palakh paneer curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Paratha 5",
        allergens: ["Gluten", "Milk (Ghee, Butter, Yogurt)", "Mustard", "Red Chilli Powder", "Sunflower Oil", "Tree Nuts"],
        price: 10.99,
        image: "/images/food-image-sizzle.png",
        category: "Main Tiffin"
      },
      {
        id: 3,
        name: "Tiffin 3",
        description: "Aloo with mutter and tomato curry 300 gm, Dal makhani 300gm, Jeera rice 200gm, Chapati 6",
        allergens: ["Gluten", "Milk (Ghee, Butter, Yogurt)", "Mustard", "Red Chilli Powder", "Sunflower Oil", "Tree Nuts"],
        price: 8.99,
        image: "/images/food-image-sizzle.png",
        category: "Main Tiffin"
      },
      {
        id: 4,
        name: "Tiffin 4",
        description: "Aloo with mutter and tomato curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Paratha 5",
        allergens: ["Gluten", "Milk (Ghee, Butter, Yogurt)", "Mustard", "Red Chilli Powder", "Sunflower Oil", "Tree Nuts"],
        price: 9.99,
        image: "/images/food-image-sizzle.png",
        category: "Main Tiffin"
      },
      {
        id: 5,
        name: "Palakh (spinach) with paneer curry 425gm (Add On)",
        description: "Simple and easy Palak Paneer is a popular Indian dish where Indian cottage cheese is cooked with spinach puree",
        allergens: ["Milk (Ghee, Butter, Yogurt)", "Red Chilli Powder", "Sunflower Oil", "Tree Nuts"],
        price: 6.99,
        image: "/images/sauce1.jpg",
        category: "Add Ons"
      },
      {
        id: 6,
        name: "Dal Makhani 425gm (Add On)",
        description: "Dal makhani is a popular North Indian dish where whole black lentils slow cooked with spices, butter & cream, sautéed onion gravy",
        allergens: ["Milk (Ghee, Butter, Yogurt)", "Red Chilli Powder", "Sunflower Oil"],
        price: 5.99,
        image: "/images/sauce2.jpg",
        category: "Add Ons"
      },
      {
        id: 7,
        name: "Aloo with mutter and tomato curry 425gm (Add On)",
        description: "Simple gravy based curry recipe made with boiled potatoes, mutter and tomatoes with Indian masala",
        allergens: ["Mustard", "Red Chilli Powder", "Sunflower Oil"],
        price: 4.99,
        image: "/images/sauce3.jpg",
        category: "Add Ons"
      },
      {
        id: 8,
        name: "Jeera rice 300gm (Add On)",
        description: "Steamed Basmati rice, mixed with the whole jeera fried in ghee, garnished with coriander",
        allergens: ["Gluten", "Milk (Ghee, Butter, Yogurt)", "Sunflower Oil"],
        price: 3.99,
        image: "/images/food-image-sizzle.png",
        category: "Add Ons"
      }
    ],
    tuesday: [
      // Different menu for Tuesday - you can customize this
      {
        id: 1,
        name: "Tuesday Special Tiffin 1",
        description: "Chicken curry 300gm, Rajma 300gm, Jeera rice 200gm, Chapati 6",
        allergens: ["Gluten", "Milk (Ghee, Butter, Yogurt)", "Mustard", "Red Chilli Powder", "Sunflower Oil"],
        price: 11.99,
        image: "/images/food-image-sizzle.png",
        category: "Main Tiffin"
      }
      // Add more items for Tuesday...
    ]
    // Add other days...
  };

  // Delivery timing data
  const deliveryTimings = {
    delivery: {
      eta: "45-60 mins",
      windows: ["11:00 AM - 1:00 PM", "6:00 PM - 8:00 PM"],
      fee: 2.49
    },
    collection: {
      eta: "15-20 mins",
      windows: ["11:00 AM - 1:00 PM", "6:00 PM - 8:00 PM"],
      fee: 0
    }
  };

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    setCurrentDay(today);
  }, []);

  const currentMenu = menuData[currentDay] || menuData.monday;

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.id !== itemId);
      }
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    return deliveryOption === 'delivery' ? deliveryTimings.delivery.fee : 0;
  };

  const getFinalTotal = () => {
    return getCartTotal() + getDeliveryFee();
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const groupedMenu = currentMenu.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-accent-yellow text-charcoal">
      {/* Header Section */}
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-4">
              {currentDay ? `${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}'s Menu` : "Today's Menu"}
            </h1>
            <p className="text-lg md:text-xl text-charcoal/80 mb-6">
              Fresh Indian tiffins delivered to your door
            </p>
            
            {/* Delivery Options */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
                <button
                  onClick={() => setDeliveryOption('delivery')}
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
                <div>
                  <p className="text-sm font-medium text-charcoal/70 mb-2">Delivery Areas</p>
                  <p className="text-lg font-bold text-charcoal">
                    BR1 - BR7, Orpington
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-charcoal/70 mb-2">Free Delivery</p>
                  <p className="text-lg font-bold text-charcoal">
                    £20 minimum order within 3 miles
                  </p>
                </div>
                
                <div className="pt-2 border-t border-charcoal/20">
                  <p className="text-xs text-charcoal/60 italic">
                    Orders for today will be taken and delivered until 12:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex gap-8">
            {/* Menu Items */}
            <div className="flex-1">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <section key={category} className="mb-12">
                  <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 border-b-2 border-charcoal pb-2">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {items.map((item) => (
                      <div key={item.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-6 flex gap-6">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                          <p className="text-charcoal/80 mb-3">{item.description}</p>
                          <div className="mb-3">
                            <p className="text-sm font-medium text-charcoal/70 mb-1">Allergens:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.allergens.map((allergen, index) => (
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
                            {getItemQuantity(item.id) === 0 ? (
                              <Button
                                onClick={() => addToCart(item)}
                                variant="secondary"
                                size="small"
                              >
                                Add to Basket
                              </Button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-lg font-bold hover:bg-charcoal/90 transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold text-lg">
                                  {getItemQuantity(item.id)}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-lg font-bold hover:bg-charcoal/90 transition-colors"
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
                      <div key={item.id} className="flex items-center justify-between bg-white/30 rounded-lg p-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-charcoal/70">£{item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
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
                    {getDeliveryFee() > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <span>£{getDeliveryFee().toFixed(2)}</span>
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
                    variant="secondary"
                    className="w-full"
                  >
                    Proceed to Checkout
                  </Button>

                  {getCartTotal() < 20 && (
                    <p className="text-xs text-center mt-2 text-charcoal/70">
                      Spend £{(20 - getCartTotal()).toFixed(2)} more for free delivery!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <section key={category} className="mb-8">
                <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-charcoal pb-2">
                  {category}
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                      <p className="text-charcoal/80 text-sm mb-3">{item.description}</p>
                      <div className="mb-3">
                        <p className="text-xs font-medium text-charcoal/70 mb-1">Allergens:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.map((allergen, index) => (
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
                        {getItemQuantity(item.id) === 0 ? (
                          <Button
                            onClick={() => addToCart(item)}
                            variant="secondary"
                            size="small"
                          >
                            Add to Basket
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-lg font-bold hover:bg-charcoal/90 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-lg">
                              {getItemQuantity(item.id)}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 bg-charcoal text-accent-yellow rounded-full flex items-center justify-center text-lg font-bold hover:bg-charcoal/90 transition-colors"
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
              variant="secondary"
              size="default"
            >
              Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
