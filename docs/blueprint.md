# **App Name**: FSLNO

## Core Features:

- Luxury Storefront Experience: High-end minimalist UI featuring a Bento Grid hero section with mixed-size cards for collections/drops, sophisticated sticky navigation, and responsive product grids for an immersive shopping journey.
- Advanced Product Interaction: Dynamic Size Chart Drawer that pulls category-specific data from Firestore, aspect-[3/4] image scaling with object-cover for all products, and a sticky 'Add to Cart' bar for a smooth purchase flow on product detail pages.
- Streamlined Checkout Process: AJAX slide-out cart with 'Order Note' functionality and a 'Free Shipping Progress Bar' to enhance conversion rates through a modern and efficient checkout flow.
- Admin Command Center: A high-fidelity, Shopify 'Polaris'-inspired admin dashboard providing centralized control over store configurations, product management, and operational settings.
- Real-time Content & Style Editor: A live theme engine allowing administrators to modify global styles (logos, hex colors, font-weights), banner content (text, background color, link), and store layout views, leveraging Firestore's useDocument for instant storefront updates.
- Integrated E-commerce Operations: Comprehensive tools for managing shipping zones and rates (flat/weight), configuring secure payment gateways (Stripe/PayPal API keys with sandbox/live toggle), and automated inventory/category linkages, all protected by strict access controls.
- AI Product Description Tool: A generative AI-powered tool within the admin dashboard to assist administrators in crafting compelling, high-quality product descriptions automatically, boosting content creation efficiency and consistency.

## Style Guidelines:

- Primary color: Pitch Black (#000000) for strong typographic hierarchy, bold contrasts, and conveying a sense of luxury and sophistication.
- Background color: Cool Gray (#F4F4F4) to establish a minimalist, clean, and spacious foundation for content, allowing products to stand out.
- Accent color: Pure White (#FFFFFF) to provide crisp contrast for interactive elements, overlays, and to reinforce a sense of purity and elegance within the design.
- Headline font: 'Playfair' (serif) for elegant, high-fashion headings, reflecting the luxury aesthetic.
- Body font: 'Inter' (sans-serif) for clean, modern, and highly readable body text, ensuring clear communication.
- Clean, line-art based icons with a minimalist aesthetic, complementing the high-end, uncluttered visual design.
- Responsive grid system utilizing grid-cols-1 md:grid-cols-2 lg:grid-cols-4 with gap-6 for dynamic product displays.
- All content wrapped in a max-w-[1440px] mx-auto px-4 container for consistent spacing and optimal readability across devices.
- Prevention of text-overflow using line-clamp, and all interactive buttons ensured to be at least 44px tall for enhanced mobile touch accuracy.
- Subtle and fluid animations, including sticky header transitions (transparent to solid white) and smooth slide-out behaviors for the cart and dynamic drawers, to provide an elegant user experience.