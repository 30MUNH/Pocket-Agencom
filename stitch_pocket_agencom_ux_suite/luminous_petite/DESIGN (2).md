---
name: Luminous Petite
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#49454b'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#7a767c'
  outline-variant: '#cac5cc'
  surface-tint: '#625b6c'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1e1927'
  on-primary-container: '#888193'
  inverse-primary: '#ccc3d7'
  secondary: '#6d595b'
  on-secondary: '#ffffff'
  secondary-container: '#f7dcde'
  on-secondary-container: '#735f61'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#211a1b'
  on-tertiary-container: '#8c8182'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9dff3'
  primary-fixed-dim: '#ccc3d7'
  on-primary-fixed: '#1e1927'
  on-primary-fixed-variant: '#4a4454'
  secondary-fixed: '#f7dcde'
  secondary-fixed-dim: '#dac0c2'
  on-secondary-fixed: '#26181a'
  on-secondary-fixed-variant: '#544244'
  tertiary-fixed: '#eddfe0'
  tertiary-fixed-dim: '#d0c3c5'
  on-tertiary-fixed: '#211a1b'
  on-tertiary-fixed-variant: '#4d4546'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  sidebar-width: 280px
  section-padding-desktop: 64px
  section-padding-mobile: 24px
---

## Brand & Style

The design system is engineered for micro-SME owners who value simplicity and sophistication. The brand personality is **nurturing, high-end, and effortless**. It avoids the intimidating complexity of traditional SaaS in favor of a "concierge" experience.

The visual style is a hybrid of **Minimalism and Soft UI**. It utilizes a "White-Plus" strategy where the interface is primarily white to ensure maximum legibility and mental clarity, punctuated by soft pastel pinks that act as a friendly guide rather than a loud alert. The emotional response should be one of relief and confidence—moving away from technical friction toward elegant business growth.

## Colors

The palette is anchored in a pristine white background to maintain an airy feel. 
- **Primary:** A deep, soft charcoal-purple used exclusively for text and critical icons to ensure professional grounding.
- **Secondary (Petal Pink):** Used for large decorative areas, secondary buttons, and subtle component backgrounds.
- **Tertiary (Mist Pink):** A very faint wash used for card backgrounds or sectioning to provide depth without using gray.
- **Accent Pink:** A more saturated, yet soft pink reserved for high-priority calls to action, active states, and notifications.
- **Surface:** Pure white (#FFFFFF) is the primary surface for all interactive cards.

## Typography

The typography utilizes **Plus Jakarta Sans** for its friendly, modern, and highly legible geometric forms. It provides a contemporary feel that scales beautifully from large display headers to functional body copy.

For technical labels and metadata, **Hanken Grotesk** is used to provide a slight stylistic contrast that feels precise and professional. 

**Weight Usage:** 
- Use *Bold (700)* only for primary displays.
- Use *SemiBold (600)* for sub-headers and button text.
- Use *Regular (400)* for all long-form reading to maintain the "airy" brand promise.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to ensure content remains centered and digestible, preventing "information sprawl" on ultra-wide monitors.

- **The Sidebar:** A fixed 280px left-hand navigation with a clear vertical hierarchy.
- **The Canvas:** The main content area uses a 12-column grid with generous 24px gutters.
- **Rhythm:** All margins and paddings must be multiples of 8px. Use larger-than-standard padding (32px+) inside cards to emphasize the premium, spacious feel.
- **Mobile:** Transition to a 1-column fluid layout. The sidebar collapses into a bottom-sheet navigation or a simplified hamburger menu to maintain the "one-handed" friendly use case.

## Elevation & Depth

This design system eschews heavy borders in favor of **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Background):** Pure White or Tertiary Mist Pink.
- **Level 1 (Cards/Floating Elements):** Pure White with a very soft, diffused shadow. Shadow specs: `Y: 4px, B: 24px, Color: rgba(255, 143, 163, 0.08)`. Note the subtle pink tint in the shadow to maintain the color narrative.
- **Level 2 (Active/Hover):** Increased shadow spread and a slight upward translation (-2px) to provide tactile feedback.
- **Interactions:** Use backdrop blurs (20px) on top navigation bars and modals to create a glassmorphic sense of depth without looking overly "techy."

## Shapes

The shape language is defined by **organic, ultra-rounded corners**. This "pill-style" influence removes visual tension and makes the software feel safer and more approachable.

- **Cards:** Use `rounded-2xl` (1.5rem) as the standard.
- **Buttons & Inputs:** Use `rounded-full` (pill) for primary actions to distinguish them clearly from layout containers.
- **Icons:** Should always be enclosed in a circular or "squircle" background container when used as a decorative element or badge.

## Components

### Buttons
- **Primary:** Pill-shaped, Accent Pink background with White text. No border.
- **Secondary:** Pill-shaped, Tertiary Mist Pink background with Primary Charcoal text.
- **Ghost:** No background, Primary Charcoal text, appearing on hover with a Soft Petal Pink wash.

### Cards & Widgets
- White background, `rounded-3xl` (2rem) corners, and the signature tinted ambient shadow.
- Header areas inside cards should use `label-sm` for categorization.

### Form Inputs
- Backgrounds should be Mist Pink (Tertiary) rather than white to contrast against the white background.
- Focus state: A soft 2px Accent Pink outer glow, no harsh black outlines.

### Stepper Component
- Horizontal steps using thin lines and circular indicators.
- Completed steps use a Soft Petal Pink circle with a white checkmark.
- Active steps use an Accent Pink circle.

### Sidebar Navigation
- Subtle vertical list. The "Active" state is indicated by a vertical pill-shaped pill on the left of the item and a very soft pink background highlight that doesn't touch the edges of the sidebar.