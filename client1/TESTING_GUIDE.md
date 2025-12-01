# Mobile UI Testing Guide

## 1. Safe Area Insets Testing

### iOS Devices (iPhone X and newer)
Test on devices with notch/Dynamic Island to verify safe area support:

**Test Cases:**
- [ ] iPhone 14 Pro (Dynamic Island)
- [ ] iPhone 13/12 (Notch)
- [ ] iPhone SE (No notch - should still work)

**What to Check:**
1. Bottom navigation doesn't get hidden by home indicator
2. Top content doesn't overlap with notch/Dynamic Island
3. Content is properly padded on both portrait and landscape
4. Swipe gestures don't interfere with navigation

**Expected Behavior:**
```css
/* Bottom nav should respect safe area */
.fixed-bottom-safe {
  bottom: env(safe-area-inset-bottom, 0);
}
```

### Android Devices
Test on devices with gesture navigation:
- [ ] Samsung Galaxy (One UI gesture nav)
- [ ] Google Pixel (Android 10+ gestures)

---

## 2. Touch Target Verification

### Minimum Size Requirements
All interactive elements must be **at least 44x44px** (iOS) or **48x48px** (Material Design).

**Test on Real Devices:**
1. Open Chrome DevTools on mobile
2. Enable "Show tap highlights"
3. Verify all buttons/cards are easily tappable

**Components to Test:**
- [ ] Bottom navigation icons (min-h-[44px])
- [ ] Connect buttons (min-w-[100px] min-h-[44px])
- [ ] Online astrologer cards (w-28 h-20 avatar)
- [ ] Card tap areas (p-5 padding)
- [ ] Search bar touch target

---

## 3. Performance Audit with Lighthouse

### Running Lighthouse
```bash
# Build production version
cd /Users/wohozo/astroweb/client
npm run build

# Serve production build
npx serve dist

# Open Chrome DevTools > Lighthouse
# Select: Mobile, Performance, Accessibility, Best Practices, SEO
# Click "Analyze page load"
```

### Target Scores
- **Performance:** 90+ (code splitting, lazy loading)
- **Accessibility:** 95+ (ARIA labels, contrast)
- **Best Practices:** 90+
- **SEO:** 95+ (meta tags, semantic HTML)

### Key Metrics to Monitor
- **FCP (First Contentful Paint):** < 1.8s
- **LCP (Largest Contentful Paint):** < 2.5s
- **TBT (Total Blocking Time):** < 200ms
- **CLS (Cumulative Layout Shift):** < 0.1

---

## 4. Accessibility Testing

### Screen Reader Testing

**iOS VoiceOver:**
1. Settings > Accessibility > VoiceOver > On
2. Navigate through the app
3. Verify all interactive elements are announced
4. Check image alt texts
5. Verify button labels

**Android TalkBack:**
1. Settings > Accessibility > TalkBack > On
2. Test navigation flow
3. Verify content descriptions

### Color Contrast
Use Chrome DevTools Accessibility panel:
```
DevTools > Elements > Accessibility
- Check contrast ratios
- Target: 4.5:1 for normal text
- Target: 3:1 for large text
```

**Current Theme Contrast:**
- White text on space-900 (#0f172a): ✅ 15.5:1
- Gold-400 (#fbbf24) on space-900: ✅ 8.2:1
- Purple-500 on space-900: ✅ 4.8:1

### Keyboard Navigation
Test on desktop:
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals/sheets
- [ ] Focus visible on all elements

---

## 5. Device Testing Checklist

### Small Screens (320px - 375px)
- [ ] iPhone SE (375px)
- [ ] Small Android phones (360px)
- **Check:** Text doesn't overflow, buttons don't overlap

### Medium Screens (390px - 428px)
- [ ] iPhone 13/14 (390px)
- [ ] iPhone 14 Pro Max (428px)
- **Check:** Optimal spacing, readable font sizes

### Large Screens (768px+)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- **Check:** Desktop layout activates, sidebar shows

### Landscape Mode
- [ ] All screen sizes in landscape
- **Check:** Bottom nav still accessible, safe areas respected

---

## 6. Network Performance Testing

### Slow 3G Simulation
Chrome DevTools > Network > Throttling:
1. Select "Slow 3G"
2. Hard reload (Cmd+Shift+R)
3. Verify skeleton loaders appear
4. Check lazy image loading works

### Expected Behavior:
- Skeleton loaders visible during data fetch
- Images load progressively with blur placeholders
- No layout shift when content loads
- Smooth transitions

---

## 7. Micro-Interactions Verification

### Animations to Test:
- [ ] Button tap scale (0.92-0.95)
- [ ] Card hover scale (1.01-1.05)
- [ ] Ripple effects on tap
- [ ] Online indicator pulse
- [ ] Avatar rotate on tap
- [ ] Skeleton pulse animation
- [ ] Page transitions

### Performance Check:
All animations should run at **60fps** (16ms per frame).

Use Chrome DevTools:
```
Performance > Record > Interact with app > Stop
Check for frame drops (look for red bars)
```

---

## 8. Cross-Browser Testing

### Mobile Browsers
- [ ] iOS Safari (primary)
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Desktop Browsers (Responsive Mode)
- [ ] Chrome DevTools Mobile Emulation
- [ ] Firefox Responsive Design Mode
- [ ] Safari Responsive Design Mode

---

## Test Results Template

```markdown
## Test Results - [Date]

### Device: [iPhone 14 Pro / Pixel 7 / etc.]
- **OS Version:** iOS 17.2 / Android 14
- **Browser:** Safari / Chrome
- **Screen Size:** 390x844

### Safe Area Insets
- [ ] Top area clear
- [ ] Bottom nav accessible
- [ ] No content behind notch

### Touch Targets
- [ ] All buttons easily tappable
- [ ] No accidental taps
- [ ] Comfortable spacing

### Performance
- Lighthouse Score: __/100
- FCP: __s
- LCP: __s
- Notes: ___

### Accessibility
- Screen reader: [ ] Pass / [ ] Fail
- Color contrast: [ ] Pass / [ ] Fail
- Keyboard nav: [ ] Pass / [ ] Fail

### Issues Found:
1. [List any issues]
2.

### Screenshots:
[Attach if needed]
```

---

## Quick Test Commands

```bash
# Build for production
npm run build

# Analyze bundle size
npx vite-bundle-visualizer

# Preview production build
npm run preview

# Run accessibility audit
npx lighthouse http://localhost:4173 --only-categories=accessibility --view

# Full Lighthouse audit
npx lighthouse http://localhost:4173 --view
```
