import React from 'react';
import { useNavigate } from 'react-router-dom';
import CurvedLoop from './CurvedLoop';

// Mobile-specific Hero component
const MobileHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden md:hidden">
      {/* Solid orange background */}
      <div className="absolute inset-0 bg-primary-orange"></div>
      
      {/* Mobile-optimized layout with full-width image */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main headline */}
        <div className="flex items-center justify-center px-4 pt-16 pb-8">
          <h1 className="text-[2.5rem] font-extrabold uppercase tracking-tight leading-[0.9] text-accent-yellow text-center">
            FRESH FLAVOURS, EVERY DAY
          </h1>
        </div>
        
        {/* Full-width image container with button overlay */}
        <div className="flex-1 relative px-4">
          {/* Full-width image - smooth squared container with blurred boundary */}
          <div className="w-full h-[50vh] min-h-[350px] rounded-3xl overflow-hidden shadow-2xl relative z-10 border-4 border-white/30 backdrop-blur-sm bg-white/10">
            <img 
              src="/images/hero-bbq.jpg" 
              alt="Authentic homemade Indian food in South East London"
              className="w-full h-full object-cover"
            />
            {/* Blurred overlay for glass effect */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
            
            {/* Order button positioned on top of image */}
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <button
                onClick={() => navigate('/menu')}
                className="bg-transparent border-2 border-accent-yellow text-accent-yellow px-12 py-6 rounded-full font-bold text-xl uppercase tracking-wide shadow-lg hover:text-primary-orange transition-colors duration-200 transform hover:scale-105"
              >
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copy block and zigzag text - mobile optimized with left alignment */}
      <div className="relative z-10 bg-primary-orange py-8 px-4">
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

// Desktop Hero component (full-width image layout)
const DesktopHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden hidden md:block">
      {/* Solid orange background */}
      <div className="absolute inset-0 bg-primary-orange"></div>
      
      {/* Desktop layout with full-width image */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main headline */}
        <div className="flex items-center justify-center px-6 pt-16 pb-12">
          <h1 className="text-[6rem] lg:text-[8rem] font-extrabold uppercase tracking-tight leading-none text-accent-yellow text-center">
            FRESH FLAVOURS,
            <br/> EVERY DAY
          </h1>
        </div>
        
        {/* Full-width image container with button overlay */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto w-full">
            {/* Full-width image - smooth squared container with blurred boundary */}
            <div className="w-full h-[60vh] min-h-[500px] rounded-3xl overflow-hidden shadow-2xl relative z-10 border-4 border-white/30 backdrop-blur-sm bg-white/10">
              <img 
                src="/images/hero-bbq.jpg" 
                alt="Authentic homemade Indian food in South East London"
                className="w-full h-full object-cover"
              />
              {/* Blurred overlay for glass effect */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
              
              {/* Order button positioned on top of image */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <button
                  onClick={() => navigate('/menu')}
                  className="bg-transparent border-2 border-accent-yellow text-accent-yellow px-16 py-8 rounded-full font-bold text-2xl uppercase tracking-wide shadow-xl hover:text-primary-orange transition-colors duration-200 transform hover:scale-105"
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
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