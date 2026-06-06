---
name: Struxiva AI
colors:
  surface: '#13121b'
  surface-dim: '#13121b'
  surface-bright: '#393842'
  surface-container-lowest: '#0e0d16'
  surface-container-low: '#1b1b24'
  surface-container: '#1f1f28'
  surface-container-high: '#2a2933'
  surface-container-highest: '#35343e'
  on-surface: '#e4e1ee'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#e4e1ee'
  inverse-on-surface: '#302f39'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#ffb695'
  on-tertiary: '#571f00'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#13121b'
  on-background: '#e4e1ee'
  surface-variant: '#35343e'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The brand personality for the design system is defined by precision, high-velocity intelligence, and visionary reliability. It targets enterprise decision-makers and data scientists who require a platform that feels both sophisticated and hyper-functional. 

The aesthetic is **Modern Corporate with Glassmorphic accents**, blending the structured reliability of traditional SaaS with the ethereal, "alive" quality of modern AI. The UI should feel like a crystalline lens—clear, multi-layered, and illuminating. Whitespace is used as a structural tool to prevent cognitive overload, while subtle gradients and blurs signal the presence of generative intelligence.

## Colors

The palette is anchored in a deep, nocturnal neutral base to allow AI-driven insights to "glow" and command attention. 

- **Primary Gradient:** A professional transition from Indigo (#4F46E5) to Blue (#3B82F6), used for primary actions and "active intelligence" states.
- **Secondary:** Deep Purple (#7C3AED) is reserved for specialized AI features, such as synthesis or generative prompts.
- **Semantic Colors:** Emerald, Amber, and Rose are used at high saturation levels to ensure instant recognition against the dark backgrounds.
- **Neutrals:** A sophisticated range of cool grays with subtle blue undertones (Slate/Zinc) maintains professional tone and prevents the "flat black" look.

## Typography

This design system utilizes **Inter** for its systematic clarity and modern grotesque characteristics. 

Headings use tight letter spacing (negative tracking) to create a dense, "engineered" look suitable for technical leadership. Body text prioritizes legibility with generous line heights. For data-dense environments like tables or code snippets, the weight is kept at 400 or 500 to ensure clarity against the dark UI. Labels use a slightly heavier weight and increased tracking for immediate scannability.

## Layout & Spacing

The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

A strict 8px base unit (the "Step") governs all spatial relationships. Enterprise dashboards should utilize "Container-Max" widths of 1440px to prevent excessive scanning paths. Use the `lg` and `xl` spacing tokens to separate major functional blocks (e.g., separating the global AI chat interface from the data visualization area), while `sm` and `md` tokens are used for internal component padding.

## Elevation & Depth

Hierarchy is established through **Backdrop Blurs and Tonal Stacking** rather than heavy shadows. 

1.  **Level 0 (Base):** The dark neutral background.
2.  **Level 1 (Cards/Panels):** Semi-transparent surfaces (Opacity: 40-60%) with a 12px to 20px blur. Surfaces are finished with a 1px "Inner Glow" border (white at 10% opacity) to define edges.
3.  **Level 2 (Overlays/Modals):** Darker, more opaque surfaces with a 1px border using the primary gradient at low opacity.
4.  **AI State:** Components currently processing data or generating insights use a "Crystalline" effect—a subtle, animated noise texture overlay and a 2px outer glow in the primary blue/indigo hue.

## Shapes

The design system adopts a **Rounded (Level 2)** shape language. This softens the technical nature of the AI platform, making it feel more approachable and modern. 

Standard components like input fields and buttons use a 0.5rem (8px) radius. Larger containers and dashboard cards use a 1rem (16px) radius. This differentiation creates a nested visual logic where internal elements feel securely "housed" within their parent containers.

## Components

### Buttons
Primary buttons use the Indigo-to-Blue gradient with white text. Ghost buttons use the 1px subtle border defined in the Elevation section. AI-specific buttons may feature a "shimmer" animation across the gradient.

### High-End Cards
Cards must feature a `backdrop-filter: blur(16px)`. Include a subtle gradient stroke that originates from the top-left corner. For AI-generated insights, include a "crystalline" texture—a very low-opacity grain—to differentiate them from static data.

### Data Tables
Tables should be minimal with no vertical borders. Use subtle row striping (2% white opacity). Headers should use the `label-sm` typography style for a professional, "metadata" feel.

### AI Elements
- **Glowing Borders:** Use for "Focus Mode" or when an AI agent is active in a specific module.
- **AI Input:** The command bar should be floating, pill-shaped (`rounded-xl`), and feature a pulsing cursor in the secondary purple color.
- **Charts:** Use a custom-tinted palette derived from the primary and secondary colors. Lines should have a subtle glow effect (drop-shadow with spread).

### Form Fields
Inputs use a dark, semi-transparent fill with a bottom-only border that illuminates to the full primary gradient upon focus.