import React from 'react';
import Button from '../ui/Button';

const About = () => {
  return (
    <section className="bg-primary-orange py-20 md:py-24 relative">
      {/* Gradient transition overlay at the top */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent-yellow to-primary-orange"></div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left text content */}
          <div className="text-white space-y-6 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl uppercase font-extrabold tracking-tight text-accent-yellow text-left">
              ABOUT TGIF DABBA
            </h2>
            
            <div className="space-y-4 text-lg md:text-xl leading-relaxed text-accent-yellow text-left">
              <p>
                Welcome to TGIF DABBA - The Great Indian Food, a family-run homemade Indian food service 
                bringing authentic vegetarian dishes to South East London. Born from generations of traditional 
                cooking, we serve fresh, daily-changing meals that celebrate the rich diversity of Indian cuisine.
              </p>
              <p>
                Every dabba (tiffin box) tells a story of family recipes passed down through generations. 
                From Monday's loki curry to Friday's undhiyu, we craft each dish with love, using fresh 
                ingredients and traditional spices. Our South East London kitchen is where authentic Indian 
                flavours meet local community warmth.
              </p>
            </div>
            
            {/* Optional CTA */}
            <div className="pt-4">
              <Button variant="primary" size="default">
                Order Now
              </Button>
            </div>
          </div>
          
          {/* Right portrait photo */}
          <div className="relative animate-fade-in-up">
            <div className="relative">
              <img 
                src="/images/stanley.jpg" 
                alt="TGIF DABBA - Authentic Indian Food in South East London"
                className="rounded-[40px] overflow-hidden aspect-[4/5] object-cover shadow-2xl w-full"
              />
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-[40px] border-4 border-white/20"></div>
            </div>
            
            {/* Background decorative element */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-yellow/20 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
