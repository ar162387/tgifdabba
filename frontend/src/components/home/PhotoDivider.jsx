import React from 'react';

const PhotoDivider = () => {
  return (
    <section className="w-full">
      {/* Full-bleed horizontal food image strip */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src="/images/food-image-sizzle.png" 
          alt="Sizzling BBQ food"
          className="w-full h-full object-cover"
        />
        {/* Subtle overlay for visual depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
        
        {/* Optional text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 opacity-90">
              The Perfect Sizzle
            </h3>
            <p className="text-sm md:text-base opacity-80">
              Every bite tells a story of flavor
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoDivider;
