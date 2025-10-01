import React from 'react';
import { useNavigate } from 'react-router-dom';
import CurvedLoop from './CurvedLoop';
import Button from '../ui/Button';

// Mobile-specific Hero component
const MobileHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden md:hidden">
      {/* Solid orange background */}
      <div className="absolute inset-0 bg-primary-orange"></div>
      
      {/* Mobile layout: Fresh flavours first, then image, then button, then text content */}
      <div className="relative z-10 flex flex-col">
        
        {/* Main headline at top */}
        <div className="px-4 pt-16 pb-8">
          <div className="animate-fade-in-up">
            <h1 className="text-[2.5rem] font-extrabold uppercase tracking-tight leading-[0.9] text-accent-yellow text-center">
              FRESH FLAVOURS, EVERY DAY
            </h1>
          </div>
        </div>
        
        {/* Image */}
        <div className="px-4 pb-6">
          <div className="w-full h-[35vh] min-h-[280px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-sm bg-white/10">
            <img 
              src="/images/hero-bbq.jpg" 
              alt="Authentic homemade Indian food in South East London"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Order Now button */}
        <div className="px-4 pb-6">
          <div className="flex justify-center">
            <Button 
              variant="primary" 
              size="large"
              onClick={() => navigate('/menu')}
            >
              Order Now
            </Button>
          </div>
        </div>
        
        {/* Text content */}
        <div className="px-4 space-y-6 pb-8">
          {/* Indian Taste header */}
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold uppercase tracking-wide text-accent-yellow text-center">
              Indian Taste.<br/>Just Authentic.
            </h2>
          </div>
          
          {/* Description paragraph */}
          <div className="animate-fade-in-up">
            <p className="text-base leading-relaxed text-accent-yellow text-center">
              Experience authentic homemade Indian vegetarian dishes that change daily. 
              From traditional loki and kofta to jeera rice and undhiyu, every dabba tells a story of family recipes and fresh South East London flavours.
            </p>
          </div>
        </div>
        
        {/* CurvedLoop text at the bottom with more space */}
        <div className="px-4 pb-16">
          <div className="animate-fade-in-up">
            <div className="border-t border-white/20 pt-6">
              <div className="relative h-32 overflow-visible">
                <CurvedLoop 
                  marqueeText="      Your Dabba, Your Daily Delight       .      "
                  speed={1}
                  curveAmount={400}
                  direction="left"
                  interactive={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Desktop Hero component (text left, image right layout)
const DesktopHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden hidden md:block">
      {/* Solid orange background */}
      <div className="absolute inset-0 bg-primary-orange"></div>
      
      {/* Desktop layout: Text content on left, image on right */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main headline centered at top */}
        <div className="flex items-center justify-center px-6 pt-16 pb-12">
          <h1 className="text-[6rem] lg:text-[8rem] font-extrabold uppercase tracking-tight leading-none text-accent-yellow text-center">
            FRESH FLAVOURS,
            <br/> EVERY DAY
          </h1>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex items-center py-8">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left side - Text content vertically aligned */}
              <div className="space-y-8">
                {/* Indian Taste header */}
                <div className="animate-fade-in-up">
                  <h2 className="text-4xl lg:text-5xl font-bold uppercase tracking-wide text-accent-yellow">
                    Indian Taste.<br/> Just Authentic.
                  </h2>
                </div>
                
                {/* Description paragraph */}
                <div className="animate-fade-in-up">
                  <p className="text-lg lg:text-xl leading-relaxed text-accent-yellow">
                    Experience authentic homemade Indian vegetarian dishes that change daily. 
                    From traditional loki and kofta to jeera rice and undhiyu, every dabba tells a story of family recipes and fresh South East London flavours.
                  </p>
                </div>
                
              {/* Order Now button */}
              <div className="animate-fade-in-up pt-4">
                <Button 
                  variant="primary" 
                  size="large"
                  onClick={() => navigate('/menu')}
                >
                  Order Now
                </Button>
              </div>
              </div>
              
              {/* Right side - Image */}
              <div className="animate-fade-in-up">
                <div className="w-full h-[60vh] min-h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-sm bg-white/10">
                  <img 
                    src="/images/hero-bbq.jpg" 
                    alt="Authentic homemade Indian food in South East London"
                    className="w-full h-full object-cover"
                  />
                  {/* Blurred overlay for glass effect */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CurvedLoop text at bottom with proper spacing */}
        <div className="relative z-20 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="animate-fade-in-up">
              <div className="border-t border-white/20 pt-6">
                <div className="relative h-28 overflow-visible">
                  <CurvedLoop 
                    marqueeText="      Your Dabba, Your Daily Delight       .      "
                    speed={1}
                    curveAmount={200}
                    direction="left"
                    interactive={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Hero component that conditionally renders mobile or desktop
const Hero = () => {
  return (
    <>
      <MobileHero />
      <DesktopHero />
    </>
  );
};

export default Hero;