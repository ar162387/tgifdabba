import React from 'react';

// Skeleton for menu item card
export const MenuItemSkeleton = ({ isMobile = false }) => {
  if (isMobile) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 animate-pulse">
        <div className="w-full h-32 bg-charcoal/20 rounded-lg mb-3"></div>
        <div className="h-5 bg-charcoal/20 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-charcoal/20 rounded mb-3 w-full"></div>
        <div className="h-4 bg-charcoal/20 rounded mb-3 w-2/3"></div>
        <div className="flex gap-1 mb-3">
          <div className="h-6 bg-charcoal/20 rounded-full w-16"></div>
          <div className="h-6 bg-charcoal/20 rounded-full w-20"></div>
          <div className="h-6 bg-charcoal/20 rounded-full w-14"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-charcoal/20 rounded w-16"></div>
          <div className="h-8 bg-charcoal/20 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 flex gap-6 animate-pulse">
      <div className="w-24 h-24 bg-charcoal/20 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-6 bg-charcoal/20 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-charcoal/20 rounded mb-3 w-full"></div>
        <div className="h-4 bg-charcoal/20 rounded mb-3 w-2/3"></div>
        <div className="flex gap-1 mb-3">
          <div className="h-6 bg-charcoal/20 rounded-full w-16"></div>
          <div className="h-6 bg-charcoal/20 rounded-full w-20"></div>
          <div className="h-6 bg-charcoal/20 rounded-full w-14"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-charcoal/20 rounded w-16"></div>
          <div className="h-8 bg-charcoal/20 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for section header
export const SectionHeaderSkeleton = () => (
  <div className="mb-6 animate-pulse">
    <div className="h-8 bg-charcoal/20 rounded w-48 mb-2"></div>
    <div className="h-1 bg-charcoal/20 rounded w-full"></div>
  </div>
);

// Skeleton for cart sidebar
export const CartSkeleton = () => (
  <div className="w-80 bg-white/20 backdrop-blur-sm rounded-lg p-6 h-fit sticky top-32 animate-pulse">
    <div className="h-6 bg-charcoal/20 rounded w-32 mb-4"></div>
    <div className="space-y-3 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between bg-white/30 rounded-lg p-3">
          <div className="flex-1">
            <div className="h-4 bg-charcoal/20 rounded mb-1 w-3/4"></div>
            <div className="h-3 bg-charcoal/20 rounded w-1/2"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-charcoal/20 rounded-full"></div>
            <div className="w-8 h-4 bg-charcoal/20 rounded"></div>
            <div className="w-6 h-6 bg-charcoal/20 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="space-y-2 mb-4">
      <div className="flex justify-between">
        <div className="h-4 bg-charcoal/20 rounded w-16"></div>
        <div className="h-4 bg-charcoal/20 rounded w-12"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-charcoal/20 rounded w-20"></div>
        <div className="h-4 bg-charcoal/20 rounded w-12"></div>
      </div>
      <div className="flex justify-between pt-2 border-t border-charcoal/30">
        <div className="h-5 bg-charcoal/20 rounded w-12"></div>
        <div className="h-5 bg-charcoal/20 rounded w-16"></div>
      </div>
    </div>
    <div className="h-10 bg-charcoal/20 rounded w-full"></div>
  </div>
);

// Skeleton for navigation tabs
export const NavigationSkeleton = ({ isMobile = false }) => (
  <div className={`${isMobile ? 'lg:hidden' : 'hidden lg:block'} sticky top-20 z-10 bg-accent-yellow/95 backdrop-blur-sm border-b-2 border-charcoal/20 mb-8 animate-pulse`}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-center">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${isMobile ? 'px-4 py-2' : 'px-6 py-3'} rounded-full bg-charcoal/20 w-24`}></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for page header
export const PageHeaderSkeleton = () => (
  <div className="text-center mb-8 animate-pulse">
    <div className="h-12 md:h-16 bg-charcoal/20 rounded w-80 mx-auto mb-4"></div>
    <div className="h-6 md:h-8 bg-charcoal/20 rounded w-96 mx-auto mb-6"></div>
    
    {/* Delivery Options Skeleton */}
    <div className="flex justify-center mb-6">
      <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
        <div className="px-6 py-2 rounded-full bg-charcoal/20 w-24"></div>
        <div className="px-6 py-2 rounded-full bg-charcoal/20 w-24"></div>
      </div>
    </div>

    {/* Delivery Information Skeleton */}
    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div>
          <div className="h-4 bg-charcoal/20 rounded w-24 mx-auto mb-2"></div>
          <div className="h-6 bg-charcoal/20 rounded w-48 mx-auto"></div>
        </div>
        <div>
          <div className="h-4 bg-charcoal/20 rounded w-32 mx-auto mb-2"></div>
          <div className="h-6 bg-charcoal/20 rounded w-64 mx-auto"></div>
        </div>
        <div className="pt-2 border-t border-charcoal/20">
          <div className="h-3 bg-charcoal/20 rounded w-80 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
);

// Main skeleton for entire menu page
export const MenuPageSkeleton = ({ isMobile = false }) => (
  <div className="min-h-screen bg-accent-yellow text-charcoal">
    <div className="pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <PageHeaderSkeleton />
        <NavigationSkeleton isMobile={isMobile} />
        
        {isMobile ? (
          <div className="lg:hidden">
            {[1, 2].map((section) => (
              <div key={section} className="mb-8">
                <SectionHeaderSkeleton />
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <MenuItemSkeleton key={item} isMobile={true} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hidden lg:flex gap-8">
            <div className="flex-1">
              {[1, 2].map((section) => (
                <div key={section} className="mb-12">
                  <SectionHeaderSkeleton />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((item) => (
                      <MenuItemSkeleton key={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <CartSkeleton />
          </div>
        )}
      </div>
    </div>
  </div>
);

export default {
  MenuItemSkeleton,
  SectionHeaderSkeleton,
  CartSkeleton,
  NavigationSkeleton,
  PageHeaderSkeleton,
  MenuPageSkeleton
};
