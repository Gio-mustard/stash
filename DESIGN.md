---
name: Emerald Nocturne
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c0c9c0'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8a938b'
  outline-variant: '#404942'
  surface-tint: '#96d4ab'
  primary: '#96d4ab'
  on-primary: '#00391f'
  primary-container: '#0a4d2e'
  on-primary-container: '#7fbd95'
  inverse-primary: '#2d6a48'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#434343'
  on-tertiary-container: '#b1afaf'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b1f1c6'
  primary-fixed-dim: '#96d4ab'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#115132'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 48px
---

## Brand & Style
The design system targets high-net-worth individuals and sophisticated investors. It evokes a sense of quiet luxury, security, and institutional permanence through a "Private Banking" aesthetic. 

The style is a fusion of **Minimalism** and **Glassmorphism**. It utilizes deep, charcoal-toned surfaces to minimize eye strain and highlight the primary emerald accent. Visual interest is generated through subtle depth layers and high-quality typography rather than decorative ornamentation. The emotional response is one of calm confidence and clinical precision.

## Colors
The palette is rooted in a "Deep Forest" spectrum. The primary emerald (#0A4D2E) is used sparingly for critical actions and success states to maintain its premium feel. 

- **Surface Levels:** The base background is a true neutral black (#0A0A0A). Elevated containers use Charcoal (#1A1A1A) and Onyx (#262626).
- **Accents:** A secondary muted gold or silver may be used for specific "Elite" tier status indicators, but the primary interface remains monochrome with emerald highlights.
- **Functional Colors:** Error states use a desaturated crimson; warning states use a burnt ochre to avoid clashing with the deep green theme.

## Typography
The system employs **Inter** for its systematic, Apple-like clarity. For technical data and monetary figures, **Geist** provides a developer-grade precision that reinforces the fintech narrative.

- **Hierarchy:** Use generous vertical rhythm. Headers should have significantly more top-margin than bottom-margin to clearly group content.
- **Micro-copy:** Small labels should use the `label-caps` style with increased letter spacing to ensure legibility against dark backgrounds.
- **Optical Sizing:** Ensure tight tracking on large display sizes and slightly relaxed tracking on body text.

## Layout & Spacing
The system follows an **8px grid** with a 4px baseline for micro-adjustments. 

- **Desktop:** 12-column fluid grid, max-width 1440px, 24px gutters.
- **Mobile:** 4-column grid, 16px margins. 
- **Philosophy:** Emphasize "Generous Space." Never crowd data. Increase padding within cards to 24px to denote "Premium" quality. Use auto-layout stacks with consistent gaps (16px or 32px) to maintain a vertical rhythm that feels deliberate and structured.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Soft Ambient Shadows**.

- **Z-Index 0:** Pure Black (#0A0A0A) - System background.
- **Z-Index 1:** Charcoal (#1A1A1A) - Primary cards and navigation bars.
- **Z-Index 2:** Onyx (#262626) - Modals, popovers, and elevated quick-actions.
- **Shadows:** Use a "Glow-Shadow" for active elements. Instead of a black shadow, use a highly diffused, low-opacity emerald tint `rgba(10, 77, 46, 0.15)` with a 20px blur for the floating center button.
- **Borders:** Subtle 1px inner-borders (strokes) using `white/0.05` help define edges on dark surfaces without looking heavy.

## Shapes
The shape language is sophisticated and modern. 

- **Standard Containers:** Use 16px (`rounded-lg`) for main dashboard cards.
- **Interactive Elements:** Buttons and input fields use a consistent 8px radius.
- **Pill/Circle Logic:** Elements associated with high-frequency "Actions" (Add-to-cart, Center Nav) break the 16px rule by being fully rounded (Pill or Circle) to distinguish them from "Content" containers.

## Components

### Buttons
- **Primary (Add-to-Cart):** Pill-shaped. Background: #0A4D2E. Text: White. No border.
- **Quick Actions:** Perfectly circular. Background: 10% opacity Emerald. Icon: 100% Emerald.
- **Secondary:** Transparent with a 1px Emerald outline or subtle ghost background.

### Navigation
- **Floating Action Button (FAB):** A circular center button in the bottom nav. It features a soft emerald glow shadow and a white "Plus" icon. It should sit slightly higher than the rest of the bar.

### Savings Cards (Sub-system)
Each card represents a different goal and must be visually distinct:
- **Backgrounds:** Use subtle noise textures, diagonal pinstripes, or two-tone dark gradients (e.g., #1A1A1A to #0A4D2E at 10% opacity).
- **Icons:** Use thin (1pt) line-art illustrations in the top-right corner.
- **Data:** Prominent display of the balance in `Geist` font for a "mechanical" feel.

### Inputs & Fields
- **Fields:** Subtle dark grey background (#1A1A1A) with a 1px border that turns Emerald on focus.
- **Checkboxes:** Rounded squares with Emerald fill on active state.

### Lists
- Use thin separators (`white/0.05`). Each list item should have a 16px horizontal padding to align with the layout margins.