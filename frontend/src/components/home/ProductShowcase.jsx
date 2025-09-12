import React, { useState } from 'react';
import Button from '../ui/Button';

const ProductShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const products = [
    {
      id: 1,
      name: "Monday Special: Loki Curry",
      price: "£8.50",
      image: "/images/sauce1.jpg",
      description: "Traditional bottle gourd curry with aromatic spices and fresh herbs"
    },
    {
      id: 2,
      name: "Wednesday Special: Kofta & Rice",
      price: "£9.50",
      image: "/images/sauce2.jpg",
      description: "Homemade vegetable koftas in rich tomato gravy with jeera rice"
    },
    {
      id: 3,
      name: "Friday Special: Undhiyu",
      price: "£10.50",
      image: "/images/sauce3.jpg",
      description: "Gujarati mixed vegetable curry with traditional spices and fresh coriander"
    }
  ];

  const nextProduct = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
  };

  return (
    <section className="bg-primary-orange py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl md:text-7xl uppercase font-extrabold tracking-tight text-accent-yellow mb-4">
            DISCOVER OUR <br/> DAILY SPECIALS
          </h2>
        </div>
        
        {/* Desktop Product grid */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div 
              key={product.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Product card with only image */}
              <div className="bg-transparent rounded-2xl p-8 mb-6">
                <div className="text-center">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="mx-auto h-64 w-auto object-contain"
                  />
                </div>
              </div>
              
              {/* Product name and price with transparent background */}
              <div className="space-y-4">
                <div className="bg-transparent p-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-accent-yellow mb-2 text-left">
                    {product.name}
                  </h3>
                  <div className="text-lg font-semibold text-accent-yellow text-left">
                    {product.price}
                  </div>
                </div>
                
                {/* CTA Button */}
                <Button>
                  Order Your Dabba
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={prevProduct}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-accent-yellow/90 text-charcoal rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold hover:bg-accent-yellow transition-colors"
            >
              ‹
            </button>
            <button
              onClick={nextProduct}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-accent-yellow/90 text-charcoal rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold hover:bg-accent-yellow transition-colors"
            >
              ›
            </button>

            {/* Current Product */}
            <div className="animate-fade-in-up">
              {/* Product card with only image */}
              <div className="bg-transparent rounded-2xl p-8 mb-6">
                <div className="text-center">
                  <img 
                    src={products[currentIndex].image} 
                    alt={products[currentIndex].name}
                    className="mx-auto h-64 w-auto object-contain"
                  />
                </div>
              </div>
              
              {/* Product name and price with transparent background */}
              <div className="space-y-4">
                <div className="bg-transparent p-4">
                  <h3 className="text-2xl font-bold text-accent-yellow mb-2 text-left">
                    {products[currentIndex].name}
                  </h3>
                  <div className="text-lg font-semibold text-accent-yellow text-left">
                    {products[currentIndex].price}
                  </div>
                </div>
                
                {/* CTA Button */}
                <Button>
                  Order Your Dabba
                </Button>
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-accent-yellow' : 'bg-accent-yellow/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
