


Goal
Create a bold, appetizing BBQ landing page for desktop (responsive down to mobile). Huge hero headline, oval food hero image, 3-card product grid, recipe teaser band, split “About Stanley,” multi-column footer, and a giant closing “Got Sauce?” banner.

Tech
	•	React + Vite + Tailwind CSS
	•	Semantic HTML, accessible, responsive (min 360px → 1440px+)

Brand Palette
	•	Primary Orange: #F58220 (dominant section bg, buttons on light)
	•	Warm Yellow: #FFD166 (recipe band)
	•	Charcoal: #2C2C2C (text on light, footer copy)
	•	Soft White: #FAFAFA (cards)
	•	Black: #000000 (final banner, high-contrast CTAs)
	•	Light Grey: #E5E5E5 (borders/dividers)

Typography & Scale
	•	Sans-serif, geometric feel.
	•	H1 (hero): desktop text-[8vw] md:text-7xl lg:text-8xl font-extrabold uppercase tracking-tight
	•	H2: text-4xl md:text-5xl uppercase font-extrabold
	•	H3: text-xl md:text-2xl font-bold
	•	Body: text-base md:text-lg with generous line-height
	•	Buttons/eyebrow links: uppercase, letter-spaced

Page Structure & Components
	1.	
	•	Left wordmark “Lexington”. Right inline links: Shop, Videos, About, Contact, Cart(9).
	•	Styles: transparent over orange hero, py-4, max-w-7xl mx-auto px-6, flex justify-between items-center.
	2.	 (Orange background)
	•	Giant H1 “BBQ IS LIFE” aligned left.
	•	Below: copy block “BBQ Sauce. Just Tastier.” with a short paragraph.
	•	Oval/ellipse food image on the right, overlapping headline bottom edge (rounded-[9999px] aspect-[16/11] object-cover shadow-xl), partially cropped.
	•	A subtle curved/ticker line under copy with repeating text “• All about the sauce • …” (can be a thin divider with repeating text, static).
	•	CTA not mandatory here (keep clean).
	3.	 (Orange continues)
	•	Section title: “DISCOVER OUR TOP FLAVORS.”
	•	3-column grid of product cards (equal width):
	•	Bottle image (centered, ample white space).
	•	Name + price.
	•	Pill CTA “Shop the sauce”.
	•	Card style: bg-[#FAFAFA] rounded-2xl p-6 shadow-sm hover:shadow-md transition
	•	Grid: grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6
	4.	
	•	Full-bleed horizontal food image strip between sections (h-64 md:h-80 object-cover w-full).
	•	Acts as a visual “sizzle”.
	5.	 (Warm Yellow band)
	•	Heading: “WHAT’S COOKIN’?” + subcopy “Get grillin’ with our easy-to-follow recipes.”
	•	3 tiles with small thumbnail, title, mini “Watch the video” link.
	•	Layout: max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8
	•	Tile: bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition
	6.	 (Orange background)
	•	Split layout: text left, portrait photo right (circular or ellipse crop).
	•	Heading “ABOUT STANLEY” (yellow text on orange or white with strong contrast).
	•	Short friendly paragraph (3–5 lines).
	•	Grid: max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center
	•	Photo: rounded-[40px] overflow-hidden aspect-[4/5] object-cover (or rounded-full with large ring).
	7.	
	•	Upper footer on dark charcoal: three columns
	•	Explore (Shop, Videos, About, Contact)
	•	Connect (IG/Twitter icons)
	•	Newsletter form (email input + “Sign Up” pill)
	•	Layout: bg-[#2C2C2C] text-white py-14 + max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10
	•	Input: bg-white text-[#2C2C2C] rounded-md px-4 py-3 w-full
	•	Button: rounded-full px-6 py-3 bg-[#F58220] text-[#2C2C2C] font-bold hover:opacity-90
	8.	
	•	Full-bleed black section with huge “Got Sauce?” wordmark.
	•	Centered, ultra-large type: text-white text-[14vw] md:text-[10vw] leading-none font-extrabold
	•	Optional tiny badge/button in corner (“Create a Site Like This”) as in screenshot.

Tailwind Utility Hints
	•	Container: max-w-7xl mx-auto px-6
	•	Section spacing: py-16 md:py-24
	•	Headline styles: uppercase font-extrabold tracking-tight
	•	Pills: rounded-full px-5 py-3 inline-flex items-center justify-center
	•	Dots/badges: w-2 h-2 rounded-full
	•	Shadows: shadow-sm → hover:shadow-lg on interactive cards
	•	Image masks: rounded-[9999px] for ellipse; clip-path optional

Interactions & Motion
	•	On-scroll reveal for section headings/images (opacity-0 translate-y-4 → visible).
	•	Product cards: slight lift on hover (hover:-translate-y-1 transition-transform).
	•	Recipe tiles: image zoom hover:scale-[1.02] inside overflow-hidden.
	•	Nav links: underline on hover with decoration-2 underline-offset-4.

Accessibility
	•	Ensure contrast on orange/yellow (use text-[#2C2C2C] on light, text-white on dark).
	•	aria-labels for social links.
	•	Proper form label for newsletter input, keyboard focus (focus-visible:ring-2 ring-offset-2 ring-white/60).

Responsive Rules
	•	Desktop reference width: 1280–1440px.
	•	Tablet: stack hero image below headline; product grid → 2 cols; about → stacked.
	•	Mobile: single column everywhere; keep big type but clamp sizes.

Content (placeholders)
	•	Products: Signature Secret Sauce ($14.99), Alabama White Sauce ($14.99), Memphis Hickory ($13.99).
	•	Recipes: Intro to seasoning / How to Smoke Brats / Choosing the right cuts of meat.
	•	About copy: short brand/founder story (2–4 sentences).
	•	Footer newsletter: “Drop your email to receive news and updates.”

Acceptance Criteria
	•	Visual match to screenshot: huge headline, ellipse hero photo, 3-card product grid, yellow recipe band, split about, tri-column footer, giant black “Got Sauce?” banner.
	•	Clean Lighthouse a11y ≥ 90.
	•	No external UI libs; pure Tailwind.
	•	Zero JS state required beyond basic interactions.

Deliverables
	•	src/components/TopNav.jsx, AboutStanley.jsx, Footer.jsx, ClosingBanner.jsx
	-   src/components/home/    Hero.jsx, ProductShowcase.jsx, PhotoDivider.jsx, RecipeTeasers.jsx,
	•	src/App.jsx assembling sections in order
	•	Tailwind theme extended with brand colors
	•	Sample images are alreaddy under public/images/*  use them 
