# SnowBooks Visual Redesign TODO

> **Project**: Complete visual overhaul of SnowBooks frontend with winter audio studio theme  
> **Started**: 2025-09-28  
> **Status**: Planning Phase  
> **Theme**: Winter Audio Studio - Deep blues, ice accents, warm amber highlights

## 🎯 Project Overview

Transform the SnowBooks frontend from a generic neutral interface to an engaging winter audio studio experience while maintaining all existing functionality. The redesign focuses on:

- **Visual Identity**: Winter/audio themed design with personality
- **Color Palette**: Deep winter blue, ice blue, warm amber accents
- **Typography**: Modern fonts with clear hierarchy
- **Animations**: Smooth transitions and engaging interactions
- **User Experience**: More engaging and intuitive interface

---

## 📅 Week 1: Foundation Setup
*Establish the design system foundation with new colors, fonts, and basic component updates*

### Color System & Theme
- [x] **Update Tailwind config with winter audio theme colors**
  - Replace neutral colors with deep winter blue (#1e3a8a), ice blue (#3b82f6), warm amber (#f59e0b)
  - Add supporting colors for success, warning, error states
  - **Files**: `app/tailwind.config.js`
  - **Dependencies**: Must be completed before component updates
  - **Completed**: 2025-09-28 - Added comprehensive color palette with winter-blue, warm-amber, and ice-gray scales

- [x] **Update shadcn/ui theme configuration**
  - Modify components.json and CSS variables to align with new theme
  - **Files**: `app/components.json`, `app/src/index.css`
  - **Dependencies**: Requires Tailwind config update
  - **Completed**: 2025-09-28 - Updated CSS variables to RGB format, changed base color to slate, aligned with winter theme

### Typography & Assets
- [x] **Install and configure new fonts**
  - Add Inter or Poppins for headings and JetBrains Mono for technical info
  - Update CSS imports and font loading
  - **Files**: `app/src/index.css`, `app/index.html`
  - **Completed**: 2025-09-28 - Added Inter and JetBrains Mono via Google Fonts, updated typography hierarchy

- [x] **Create design tokens and CSS variables**
  - Establish consistent spacing, typography scales, border radius, shadow values
  - **Files**: `app/src/index.css`, new `app/src/styles/design-tokens.css`
  - **Completed**: 2025-09-28 - Created comprehensive design token system with spacing, typography, shadows, animations, and winter audio theme specific tokens

### Layout Foundation
- [x] **Redesign main layout and header**
  - Update App.tsx with gradient backgrounds
  - Improved header with logo concept and better typography hierarchy
  - **Files**: `app/src/App.tsx`, `app/src/App.css`
  - **Completed**: 2025-09-28 - Complete header redesign with animated audio waveform, gradient text, feature highlights, and winter-themed background patterns

---

## 📅 Week 2: Core Components Enhancement
*Redesign and enhance core UI components with the new visual identity*

### Navigation & Progress
- [x] **Redesign StepWizard with themed icons and animations**
  - Replace numbered circles with audio/winter themed icons
  - Add gradient connecting lines and smooth transitions
  - **Files**: `app/src/components/StepWizard.tsx`
  - **Dependencies**: Requires design tokens and new icons
  - **Completed**: 2025-09-28 - Complete StepWizard redesign with winter audio theme icons, gradient progress line, enhanced animations, and professional styling

### UI Primitives
- [ ] **Enhance Button, Progress, and Card components**
  - Customize shadcn/ui components with new colors, rounded corners, shadows
  - Add audio-inspired styling variations
  - **Files**: `app/src/components/ui/button.tsx`, `app/src/components/ui/progress.tsx`

- [ ] **Create loading states and animations**
  - Design skeleton loaders, spinners, and progress indicators
  - Winter/audio theming for all loading states
  - **Files**: New `app/src/components/ui/loading.tsx`, `app/src/components/ui/skeleton.tsx`

### Error Handling & Icons
- [ ] **Implement new error boundary designs**
  - Create engaging error states with helpful messaging and recovery options
  - **Files**: `app/src/components/ErrorBoundary.tsx`

- [ ] **Add custom icons and illustrations**
  - Create or source audio-themed icons and winter-inspired illustrations
  - **Files**: New `app/src/components/icons/` directory, update existing icon usage

---

## 📅 Week 3: Step-by-Step Redesign
*Redesign each step of the wizard with enhanced visuals and interactions*

### Upload Experience
- [ ] **Redesign Upload Step with enhanced dropzone**
  - Create engaging drop zone with animated borders
  - Add snow particle effects and better file type illustrations
  - **Files**: `app/src/components/steps/UploadStep.tsx`
  - **Dependencies**: Requires new animations and icons

### Configuration & Preview
- [ ] **Enhance Configure Step volume controls**
  - Custom volume slider with waveform background
  - Better preset buttons and real-time visual feedback
  - **Files**: `app/src/components/steps/ConfigureStep.tsx`, `app/src/components/VolumeControl.tsx`

- [ ] **Improve Preview Step audio player**
  - Mini audio player with waveform visualization
  - Enhanced file list and smooth play/pause animations
  - **Files**: `app/src/components/steps/PreviewStep.tsx`

### Processing & Completion
- [ ] **Animate Process Step progress indicators**
  - Audio-themed progress bars and real-time file processing indicators
  - Better time estimates with engaging visuals
  - **Files**: `app/src/components/steps/ProcessStep.tsx`

- [ ] **Create Download Step success celebration**
  - Success animations with confetti/snow effects
  - Clear download button and better completion messaging
  - **Files**: `app/src/components/steps/DownloadStep.tsx`

---

## 📅 Week 4: Polish and Optimization
*Add final polish, optimize performance, and ensure accessibility compliance*

- [ ] **Add micro-animations and transitions**
  - Smooth hover effects, focus states, and state transitions
  - **Files**: Various component files, `app/src/styles/animations.css`

- [ ] **Implement responsive design improvements**
  - Ensure all new designs work perfectly on mobile and tablet
  - **Files**: All component files

- [ ] **Accessibility testing and fixes**
  - WCAG AA compliance verification and fixes
  - Screen reader testing and keyboard navigation
  - **Files**: Various component files

- [ ] **Performance optimization**
  - Bundle size analysis and optimization
  - Animation performance tuning
  - **Files**: `app/vite.config.ts`, various component files

- [ ] **Cross-browser testing**
  - Test and fix issues across major browsers
  - **Files**: Various component files

---

## 📅 Week 5: Advanced Features
*Implement advanced visual features and enhancements*

- [ ] **Dark mode enhancements**
  - Optimize new theme for dark mode
  - **Files**: `app/src/index.css`, various component files

- [ ] **Advanced animations (snow particles, waveforms)**
  - Implement complex visual effects
  - **Files**: New animation components

- [ ] **Custom illustrations and graphics**
  - Add branded illustrations and graphics
  - **Files**: `app/src/assets/`, various component files

- [ ] **User preference settings**
  - Allow users to customize visual preferences
  - **Files**: New settings components

- [ ] **Analytics and feedback collection**
  - Track user engagement with new design
  - **Files**: Analytics integration files

---

## ✅ Completed Changes
*Track completed tasks with timestamps and notes*

### 2025-09-28
- [x] **Update Tailwind config with winter audio theme colors** - Added comprehensive color palette including winter-blue (50-950), warm-amber (50-950), and ice-gray (50-950) scales. Added semantic colors for success (#10b981), error (#ef4444), and warning. Included custom font families and animation keyframes.

- [x] **Update shadcn/ui theme configuration** - Converted all CSS variables from OKLCH to RGB format for better compatibility. Updated light and dark mode color schemes to align with winter audio theme. Changed base color from neutral to slate in components.json. Added custom winter theme variables for consistent theming.

- [x] **Install and configure new fonts** - Added Inter and JetBrains Mono fonts via Google Fonts with preconnect for performance. Updated root font-family to use Inter as primary. Created typography hierarchy with proper font weights and line heights. Updated title to "SnowBooks - Audio Processing Studio". Removed old Vite default styles and replaced with winter theme styling.

- [x] **Create design tokens and CSS variables** - Created comprehensive design token system in `app/src/styles/design-tokens.css` with spacing scale (4px-128px), typography scale, border radius values, shadow definitions with winter blue tints, animation durations and easing functions, z-index scale, and winter audio theme specific tokens (waveform heights, snow particle sizes, audio processing spacing). Added utility classes and custom animations for audio waveforms and snow effects.

- [x] **Redesign main layout and header** - Complete transformation of App.tsx with winter audio studio theme. Added gradient background with subtle pattern overlay, animated audio waveform logo with snowflake accent, gradient text treatment for "SnowBooks" title, feature highlights with colored indicators, professional subtitle and description, improved spacing using design tokens, footer with branding, and enhanced accessibility with proper focus styles. Updated App.css with winter-themed styles, custom scrollbar, and dark mode support.

- [x] **Redesign StepWizard with themed icons and animations** - Complete overhaul of StepWizard component with winter audio studio theme. Replaced numbered circles with themed Lucide icons (Upload, Settings, Play, Zap, Download). Added gradient connecting line that animates with progress. Implemented smooth transitions using design tokens (300ms duration). Enhanced step indicators with gradient backgrounds, glow effects for current step, and hover animations. Updated step labels with better typography and color coding. Redesigned step content header with gradient badge and enhanced navigation with progress dots. Maintained full backward compatibility while significantly improving visual appeal.

---

## 📝 Implementation Notes & Considerations

### Design Decisions
- **Color Accessibility**: Ensure all color combinations meet WCAG AA standards
- **Animation Performance**: Use transform and opacity for smooth 60fps animations
- **Bundle Size**: Monitor impact of new fonts and assets on bundle size
- **Color Format**: Switched from OKLCH to RGB for better browser compatibility and easier debugging
- **Theme Structure**: Maintained shadcn/ui CSS variable structure while updating colors to winter audio theme

### Technical Considerations
- **Font Loading**: Implement proper font loading strategies to prevent FOUT
- **CSS Variables**: Use CSS custom properties for easy theme switching
- **Component API**: Maintain existing component APIs to avoid breaking changes

### Dependencies & Blockers
- Week 1 foundation tasks must be completed before Week 2 components
- Icon system needs to be established before step redesigns
- Design tokens required for consistent spacing and colors

### Browser Support
- Target: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Graceful degradation for older browsers
- Test on mobile Safari and Chrome mobile

---

## 🔗 Key Files Reference

### Configuration Files
- `app/tailwind.config.js` - Tailwind configuration and theme
- `app/components.json` - shadcn/ui configuration
- `app/vite.config.ts` - Build configuration
- `app/src/index.css` - Global styles and CSS variables

### Core Components
- `app/src/App.tsx` - Main application layout
- `app/src/components/StepWizard.tsx` - Step navigation component
- `app/src/components/FileUploader.tsx` - Main orchestrator component

### Step Components
- `app/src/components/steps/UploadStep.tsx`
- `app/src/components/steps/ConfigureStep.tsx`
- `app/src/components/steps/PreviewStep.tsx`
- `app/src/components/steps/ProcessStep.tsx`
- `app/src/components/steps/DownloadStep.tsx`

### UI Components
- `app/src/components/ui/` - shadcn/ui components directory
- `app/src/components/VolumeControl.tsx`
- `app/src/components/ErrorBoundary.tsx`

---

## 🚀 Getting Started

1. **Create feature branch**: `git checkout -b redesign/visual-overhaul`
2. **Start with Week 1 Foundation Setup**
3. **Update this TODO.md file** as you complete each task
4. **Test thoroughly** before moving to next phase
5. **Document any issues or discoveries** in the Notes section

---

*Last Updated: 2025-09-28*  
*Next Review: After Week 1 completion*
