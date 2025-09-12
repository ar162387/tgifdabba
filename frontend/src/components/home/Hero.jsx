import React from 'react';
import CurvedLoop from './CurvedLoop';

// Mobile-specific Hero component
const MobileHero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden md:hidden">
      {/* Solid orange background */}
      <div className="absolute inset-0 bg-primary-orange"></div>
      
      {/* Mobile-optimized layout with overlapping elements */}
      <div className="relative z-10">
        {/* Main headline - positioned to allow overlap */}
        <div className="flex items-center justify-center px-4 pt-16 pb-2">
          <h1 className="text-[3.5rem] font-extrabold uppercase tracking-tight leading-[0.9] text-accent-yellow text-center relative z-20 mt-8">
            FRESH FLAVOURS, EVERY DAY
          </h1>
        </div>
        
        {/* Food image - oval shape with slight overlap */}
        <div className="flex items-center justify-center px-4 -mt-4">
          <div className="w-[85vw] h-[45vh] max-h-[320px] rounded-[90%_28%] transform -rotate-4 overflow-hidden shadow-2xl relative z-10">
            <img 
              src="/images/hero-bbq.jpg" 
              alt="Authentic homemade Indian food in South East London"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Copy block and zigzag text - mobile optimized with left alignment */}
      <div className="relative z-10 bg-primary-orange py-8 px-4 mt-16">
        <div className="space-y-8">
          
          {/* Copy block - mobile vertical layout with left alignment */}
          <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-in-up">
              <h2 className="text-3xl font-bold uppercase tracking-wide text-accent-yellow text-left">
               Indian Taste.<br/>Just Authentic.
              </h2>
            </div>
            
            {/* Description */}
            <div className="animate-fade-in-up">
              <p className="text-base leading-relaxed text-accent-yellow  text-left">
                Experience authentic homemade Indian vegetarian dishes that change daily. 
                From traditional loki and kofta to jeera rice and undhiyu, every dabba tells a story of family recipes and fresh South East London flavours.
              </p>
            </div>
          </div>
          
          {/* CurvedLoop text - mobile optimized */}
          <div className="animate-fade-in-up">
            <div className="border-t border-white/20 pt-4">
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

// Desktop Hero component (original implementation)
const DesktopHero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden hidden md:block">
      {/* Solid orange background */}
      <div className="absolute inset-0 bg-primary-orange"></div>
      
      {/* Diagonally placed oval with food image inside - mirrored to left side */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70vw] h-[70vh] lg:w-[83vw] lg:h-[80vh] rounded-[50%] transform -rotate-12 -translate-x-8 -translate-y-25 overflow-hidden">
            <img 
              src="/images/hero-bbq.jpg" 
              alt="Authentic homemade Indian food in South East London"
              className="w-full h-full object-cover"
            />
        </div>
      </div>
      
      {/* Main headline on top - doubled size */}
      <div className="relative z-10 min-h-screen center ">
        <div className="max-w-7xl mx-auto px-6 w-full center items-center ">
          <h1 className="text-[18rem] lg:text-[8rem] font-extrabold uppercase tracking-tight leading-none text-accent-yellow relative z-20 mt-32 items-center justify-center">
            FRESH FLAVOURS,
            <br/> EVERY DAY
          </h1>
        </div>
      </div>
      
      {/* Separate section for copy block and zigzag text */}
      <div className="relative z-10 bg-primary-orange py-16 mt-28">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="space-y-12">
            
            {/* Copy block - horizontal layout */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left - Header */}
              <div className="animate-fade-in-up">
                <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-wide text-accent-yellow">
                  Indian Taste.<br/> Just Authentic.
                </h2>
              </div>
              
              {/* Right - Description */}
              <div className="animate-fade-in-up">
                <p className="text-lg md:text-xl leading-relaxed text-accent-yellow">
                  Experience authentic homemade Indian vegetarian dishes that change daily. 
                  From traditional loki and kofta to jeera rice and undhiyu, every dabba tells a story of family recipes and fresh South East London flavours.
                </p>
              </div>
            </div>
            
            {/* CurvedLoop text */}
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