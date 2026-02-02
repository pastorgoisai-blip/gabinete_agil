# Gabinete Ágil - Design System & Brand Guidelines

## 1. Brand Identity Overview
This document outlines the visual identity for **Gabinete Ágil**, derived from the official branding assets. The design communicates efficiency, modernity, and institutional reliability through a palette of deep greens and vibrant accents.

## 2. Color Palette

### Primary Colors
Core colors defining the brand's dominant look.

| Color Name | Hex Code | Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Rich Black** | `#000F01` | `primary-950` | Text, Dark Backgrounds |
| **Dark Green** | `#032221` | `primary-900` | Sidebar, Headers, Nav |
| **Bangladesh Green** | `#03624C` | `primary-800` | Buttons, Active States |
| **Mountain Meadow** | `#2CC295` | `primary-500` | Accents, Highlights |
| **Caribbean Green** | `#00DF81` | `primary-400` | **Brand Primary**, CTAs, Success States |
| **Anti-Flash White** | `#F1F7F6` | `primary-50` | Backgrounds, Cards |

### Secondary Colors
Supporting shades for depth and variety.

| Color Name | Hex Code | Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Pine** | `#06302B` | `secondary-900` | Deep accents |
| **Basil** | `#0B453A` | `secondary-800` | Borders, Dividers |
| **Forest** | `#095544` | `secondary-700` | Interactive Muted |
| **Frog** | `#17876D` | `secondary-600` | Secondary Action |
| **Mint** | `#2FA98C` | `secondary-500` | Success Messages, Illustrations |
| **Stone** | `#707D7D` | `neutral-500` | Muted Text, Icons |
| **Pistachio** | `#AACBC4` | `neutral-300` | Borders, Disabled states |

## 3. Typography

### Primary Typeface: **Axiforma**
*Geometric sans-serif, modern and approachable.*
- **Regular (400)**: Body text, description.
- **Medium (500)**: Navigation, subheaders.
- **Semi-Bold (600)**: Titles, Buttons, Important UI elements.

*Alternative (Free/Google Fonts):* **Outfit** or **Plus Jakarta Sans**.

## 4. Tailwind CSS Configuration Plan

### Step 1: Install Dependencies
Since `tailwindcss` is currently missing from `package.json`, it needs to be installed:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Configure `tailwind.config.js`
Update the branding colors in the configuration:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00DF81', // Caribbean Green
          50: '#F1F7F6',      // Anti-Flash White
          100: '#E0F2EC',
          200: '#AACBC4',     // Pistachio
          300: '#707D7D',     // Stone
          400: '#2CC295',     // Mountain Meadow
          500: '#00DF81',     // Caribbean Green
          600: '#2FA98C',     // Mint
          700: '#17876D',     // Frog
          800: '#03624C',     // Bangladesh Green
          900: '#032221',     // Dark Green
          950: '#000F01',     // Rich Black
        },
        secondary: {
          DEFAULT: '#17876D',
          900: '#06302B', // Pine
          800: '#0B453A', // Basil
          700: '#095544', // Forest
        }
      },
      fontFamily: {
        sans: ['Axiforma', 'Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(to bottom, #a8bbb7 0%, #63857c 100%)',
        'login-gradient': 'linear-gradient(135deg, #dbf0dd 0%, #5c8574 100%)',
      }
    },
  },
  plugins: [],
}
```

### Step 3: Global Styles (`index.css`)
Ensure Tailwind directives are present:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-primary-50 text-primary-950 font-sans;
  }
}
```

## 5. UI Application Strategy
- **Buttons**: `bg-primary-500 hover:bg-primary-600 text-primary-950 font-semibold`
- **Cards**: `bg-white dark:bg-primary-900/50 border border-primary-200`
- **Sidebar**: Use `bg-sidebar-gradient` as defined above.
- **Login**: Use `bg-login-gradient`.
