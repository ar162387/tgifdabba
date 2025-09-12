# BBQ Sauce Co. Landing Page

A mobile-first, scrollable landing page for BBQ Sauce Co. featuring bold, warm, and appetizing design with playful copy and clear sections.

## Features

- **Mobile-first responsive design** (360px → desktop)
- **Bold BBQ-themed branding** with warm color palette
- **Semantic HTML** with accessibility features
- **Smooth animations** and hover effects
- **Component-based architecture** for maintainability

## Tech Stack

- React 19 + Vite
- Tailwind CSS 4.x
- Pure CSS animations (no external libraries)

## Brand Colors

- **Primary Orange**: #F58220 (section backgrounds, buttons)
- **Accent Yellow**: #FFD166 (recipe section bg, badges)
- **Charcoal**: #2C2C2C (text on light, footer)
- **Soft White**: #FAFAFA (cards, text on dark)
- **Light Grey**: #E5E5E5 (dividers)

## Component Structure

```
src/components/Home/
├── SiteHeader.jsx      # Minimal top bar with logo and navigation
├── Hero.jsx           # Bold "BBQ IS LIFE" headline with CTA
├── AboutSauce.jsx     # Orange background section about the sauce
├── TopFlavors.jsx     # Product spotlight for signature sauce
├── RecipeTeasers.jsx  # Yellow background with recipe tiles
├── FounderStory.jsx   # Orange background with Stanley's story
├── SignupCTA.jsx      # Dark footer with newsletter signup
└── SiteFooter.jsx     # Legal footer
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Image Assets

Place the following images in `public/images/`:

- `hero-bbq.jpg` - Hero section BBQ image (800x600px)
- `sauce-bottles.jpg` - About section sauce bottles (600x400px)
- `signature-sauce.jpg` - Product spotlight bottle (400x500px)
- `founder-stanley.jpg` - Founder story image (600x400px)
- `recipe-seasoning.jpg` - Recipe thumbnail (300x200px)
- `recipe-brats.jpg` - Recipe thumbnail (300x200px)
- `recipe-meat-cuts.jpg` - Recipe thumbnail (300x200px)
- `recipe-rib-rub.jpg` - Recipe thumbnail (300x200px)

## Accessibility Features

- WCAG AA contrast compliance
- Alt text for all images
- Keyboard focus states
- Semantic HTML structure
- Screen reader friendly navigation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive from 360px to 1440px+

## Performance

- Optimized images with proper sizing
- CSS-only animations (no JavaScript libraries)
- Minimal bundle size with Vite
- Smooth scrolling and transitions