import React from 'react';
import Button from '../components/ui/Button';

const About = () => {
  return (
    <div className="min-h-screen bg-primary-orange pt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tight text-white">
                About
                <span className="block text-accent-yellow">TGIF Dabba</span>
              </h1>
              
              <div className="space-y-6 text-white/90 leading-relaxed">
                <p className="text-lg md:text-xl">
                  Welcome to TGIF Dabba, where authentic Indian flavors meet modern convenience. 
                  We believe that great food brings people together, and our mission is to deliver 
                  the warmth and richness of traditional Indian cuisine right to your doorstep.
                </p>
                
                <p className="text-lg md:text-xl">
                  Our kitchen is run by passionate chefs who have perfected recipes passed down 
                  through generations. Every dish is prepared with fresh ingredients, traditional 
                  spices, and the love that makes Indian food truly special.
                </p>
                
                <p className="text-lg md:text-xl">
                  From our signature curries to our freshly baked naan bread, every item on our 
                  menu is crafted to provide you with an authentic taste of India. Whether you're 
                  craving comfort food or looking to explore new flavors, TGIF Dabba has something 
                  special for everyone.
                </p>
              </div>
            </div>
            
            {/* Call to action */}
            <div className="pt-8">
              <Button variant="primary" size="large">
                Order Now
              </Button>
            </div>
          </div>
          
          {/* Right side - Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src="/images/hero-bbq.jpg" 
                alt="TGIF Dabba authentic Indian cuisine" 
                className="w-full h-[500px] md:h-[600px] object-cover rounded-2xl shadow-2xl"
              />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-yellow rounded-full opacity-20"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white rounded-full opacity-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
