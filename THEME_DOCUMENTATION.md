# AI Study Helper - Complete Theme Documentation

## 🎨 Primary Color Palette
- **Main Purple**: `#7C6FFF`
- **White**: `#ffffff` (for cards and buttons)
- **Text Dark**: `#2c3e50` (headings)
- **Text Light**: `rgba(255, 255, 255, 0.604)` (descriptions on purple background)
- **Text Gray**: `#7f8c8d` (secondary text)
- **Success Green**: `#27ae60`
- **Warning Orange**: `#f39c12`
- **Danger Red**: `#e74c3c`

## 📐 Layout & Spacing
- **Container Max Width**: 800px-1200px
- **Section Padding**: `5%` or `40px`
- **Card Padding**: `40px` (large cards), `20px` (small cards)
- **Gap Between Elements**: `20px-30px`
- **Border Radius**: `5px` (buttons), `15px-20px` (cards)

## 🔘 Button Styling

### Primary Buttons (CTA)
```css
background: #7C6FFF;
color: white;
border: none;
padding: 1rem 2rem;
border-radius: 5px;
font-size: 1em;
cursor: pointer;
transition: background-color 0.3s ease;
```

### Primary Button Hover
```css
background: white;
color: #7C6FFF;
border: 1px solid #7C6FFF;
```

### Secondary Buttons
```css
background: white;
color: #7C6FFF;
border: 2px solid #e9ecef;
padding: 12px 25px;
border-radius: 5px;
font-weight: 600;
```

### Secondary Button Hover
```css
background: #7C6FFF;
color: white;
border-color: #7C6FFF;
```

## 📦 Card Styling

### Main Cards
```css
background: white;
border-radius: 15px-20px;
padding: 40px;
box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
```

### Small Cards/Options
```css
background: #f8f9fa;
border: 2px solid #e9ecef;
border-radius: 12px;
padding: 15px 20px;
transition: all 0.3s ease;
```

### Card Hover Effects
```css
/* Option cards hover */
background: #e3f2fd;
border-color: #7C6FFF;

/* Selected state */
background: #7C6FFF;
color: white;
border-color: #7C6FFF;
```

## 🎯 Interactive Elements

### Progress Bar
```css
/* Container */
background: #ecf0f1;
height: 8px;
border-radius: 4px;

/* Fill */
background: #7C6FFF;
transition: width 0.3s ease;
```

### Timer Colors
```css
/* Normal */
color: #27ae60;

/* Warning (≤2 minutes) */
color: #f39c12;

/* Danger (≤1 minute) */
color: #e74c3c;
```

## 📱 Typography

### Headings
```css
/* Main titles */
font-size: 3em-3.5em;
font-weight: 700;
color: #2c3e50; /* on white background */
color: white; /* on purple background */

/* Section titles */
font-size: 2.2em-2.5em;
font-weight: 700;

/* Card titles */
font-size: 1.3em-1.4em;
font-weight: 600;
```

### Body Text
```css
/* Primary text */
font-size: 1em-1.2em;
color: #2c3e50;

/* Secondary text */
font-size: 0.9em-1.1em;
color: #7f8c8d;

/* Text on purple background */
color: rgba(255, 255, 255, 0.704);
font-style: italic; /* for descriptions */
```

## 🌈 Background Patterns

### Main Background
```css
background: #7C6FFF;
```

### Section Backgrounds
```css
/* Hero sections */
background: #7C6FFF;
border-bottom-left-radius: 15%;
border-bottom-right-radius: 15%;

/* Content sections */
background: white; /* for cards */
background: #7C6FFF; /* for main sections */
```

### Decorative Elements
```css
/* Arc separator */
background: white;
border-bottom-left-radius: 50%;
border-bottom-right-radius: 50%;
height: 100px;
```

## 🎪 Animation & Transitions

### Standard Transitions
```css
transition: all 0.3s ease;
transition: background-color 0.3s ease;
transition: color 0.3s ease;
transition: border-color 0.3s ease;
transition: width 0.3s ease; /* for progress bars */
```

### Hover Transforms
```css
/* Subtle lift for cards */
transform: translateY(-3px);

/* Button press effect */
transform: translateY(-2px);
```

## 🔍 State Indicators

### Form Validation
```css
/* Valid input */
border: 2px solid green;

/* Invalid input (focused) */
border-color: red;

/* Focus state */
outline: none;
border-color: #7C6FFF;
```

### Disabled States
```css
opacity: 0.5;
cursor: not-allowed;
```

### Active/Selected States
```css
background: #7C6FFF;
color: white;
border-color: #7C6FFF;
```

## 📐 Responsive Breakpoints

### Mobile (≤480px)
- Single column layouts
- Reduced padding: `25px 15px`
- Smaller font sizes
- Stack elements vertically

### Tablet (≤768px)
- Two column grids where applicable
- Adjusted padding: `30px 25px`
- Flexible layouts

## 🎨 Icon Styling
```css
color: #7C6FFF; /* primary icons */
font-size: 1.1em-2em; /* depending on context */
transition: color 0.3s ease;

/* On hover */
color: white; /* when background becomes purple */
```

## 🌟 Special Effects

### Box Shadows
```css
/* Standard card shadow */
box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);

/* Hover shadow */
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

/* Button shadow */
box-shadow: 0 5px 15px rgba(124, 111, 255, 0.3);
```

### Border Treatments
```css
/* Subtle borders */
border: 1px solid rgba(255, 255, 255, 0.2);

/* Form borders */
border: 1px solid transparent;

/* Active borders */
border: 2px solid #7C6FFF;
```

## 🎯 Component-Specific Rules

### Quiz Options
- Default: Light gray background with subtle border
- Hover: Light blue background with purple border
- Selected: Purple background with white text
- Font weight: 500-600 for option text

### Score Display
- Circular background: Solid #7C6FFF
- Score text: White, large font (3em for number)
- Percentage: Purple color matching theme

### Timer Display
- Icon + text layout
- Color changes based on time remaining
- Font weight: 600
- Size: 1.1em

This documentation captures every visual detail of the theme for consistent implementation across all pages.