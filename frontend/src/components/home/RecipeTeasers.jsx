import React from 'react';

const RecipeTeasers = () => {
  const recipes = [
    {
      id: 1,
      title: "Traditional Spice Blends",
      thumbnail: "/images/hero-bbq.jpg",
      description: "Learn the secrets behind authentic Indian spice combinations"
    },
    {
      id: 2,
      title: "Perfect Jeera Rice",
      thumbnail: "/images/food-image-sizzle.png",
      description: "Master the art of cooking fluffy, aromatic cumin rice"
    },
    {
      id: 3,
      title: "Vegetable Kofta Making",
      thumbnail: "/images/sauce1.jpg",
      description: "Discover how to create perfect homemade vegetable koftas"
    }
  ];

  return (
    <section className="bg-accent-yellow py-16 md:py-24 relative">
      {/* Gradient transition overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-accent-yellow to-primary-orange"></div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl uppercase font-extrabold tracking-tight text-charcoal mb-4">
            WHAT'S COOKIN'?
          </h2>
          <p className="text-lg md:text-xl text-charcoal/80 max-w-2xl mx-auto">
            Learn authentic Indian cooking with our family recipes.
          </p>
        </div>
        
        {/* Recipe tiles */}
        <div className="grid md:grid-cols-3 gap-8">
          {recipes.map((recipe, index) => (
            <div 
              key={recipe.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={recipe.thumbnail} 
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full p-4 transition-colors">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-bold text-charcoal mb-3">
                  {recipe.title}
                </h3>
                <p className="text-charcoal/70 mb-4 leading-relaxed">
                  {recipe.description}
                </p>
                
                {/* Watch video link */}
                <a 
                  href="#watch" 
                  className="inline-flex items-center text-primary-orange font-bold uppercase tracking-wide text-sm hover:text-primary-orange/80 transition-colors"
                >
                  Watch Recipe
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecipeTeasers;