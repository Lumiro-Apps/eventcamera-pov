# POV EventCamera Design Guidelines

Last updated: 2026-02-11

This document outlines the design system, patterns, and guidelines for the POV EventCamera web applications (Guest and Organizer).

## Design Philosophy

The design follows a **clean and minimal** aesthetic inspired by Linear and Vercel. Key principles:

- **Clarity over decoration**: UI elements serve a purpose, no unnecessary ornamentation
- **Consistent spacing**: Using Tailwind's 4px-based scale throughout
- **Subtle interactions**: Hover states and transitions are refined, not flashy
- **Mobile-first**: All layouts are designed for mobile and scale up

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework |
| React | 19.2.4 | UI library |
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | Latest | Component primitives |
| Radix UI | Various | Accessible primitives |
| Lucide React | 0.563.0 | Icon library |

## Color System

Colors are defined as CSS custom properties in `globals.css` using HSL values for easy theming.

### Semantic Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--color-background` | `hsl(0 0% 100%)` | Page background |
| `--color-foreground` | `hsl(224 71% 4%)` | Primary text |
| `--color-primary` | `hsl(220 70% 50%)` | Primary actions, links |
| `--color-primary-foreground` | `hsl(210 20% 98%)` | Text on primary |
| `--color-secondary` | `hsl(220 14% 96%)` | Secondary backgrounds |
| `--color-secondary-foreground` | `hsl(220 9% 46%)` | Secondary text |
| `--color-muted` | `hsl(220 14% 96%)` | Muted backgrounds |
| `--color-muted-foreground` | `hsl(220 9% 46%)` | Muted text |
| `--color-accent` | `hsl(220 14% 96%)` | Accent backgrounds |
| `--color-accent-foreground` | `hsl(220 9% 15%)` | Accent text |
| `--color-destructive` | `hsl(0 84% 60%)` | Error states, delete actions |
| `--color-destructive-foreground` | `hsl(210 20% 98%)` | Text on destructive |
| `--color-border` | `hsl(220 13% 91%)` | Borders |
| `--color-input` | `hsl(220 13% 91%)` | Input borders |
| `--color-ring` | `hsl(220 70% 50%)` | Focus rings |
| `--color-card` | `hsl(0 0% 100%)` | Card backgrounds |
| `--color-card-foreground` | `hsl(224 71% 4%)` | Card text |
| `--color-popover` | `hsl(0 0% 100%)` | Popover backgrounds |
| `--color-popover-foreground` | `hsl(224 71% 4%)` | Popover text |

### Usage in Tailwind

```jsx
// Use semantic color classes
<div className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />
<div className="border border-border" />
```

## Typography

### Font Family

- **Primary**: Inter (via `next/font/google`)
- **Fallback**: `system-ui, sans-serif`

Font is loaded with `display: 'swap'` and applied via CSS variable `--font-inter`.

### Type Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Badges, metadata |
| `text-sm` | 14px | Body text, buttons |
| `text-base` | 16px | Default body |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Page headings |
| `text-4xl` | 36px | Hero text |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Buttons, labels |
| `font-semibold` | 600 | Headings |
| `font-bold` | 700 | Emphasis |

## Spacing

Using Tailwind's default 4px-based scale:

| Token | Value | Common Uses |
|-------|-------|-------------|
| `1` | 4px | Tight gaps |
| `2` | 8px | Icon gaps, small padding |
| `3` | 12px | Button padding, card gaps |
| `4` | 16px | Section gaps, card padding |
| `6` | 24px | Large gaps |
| `8` | 32px | Section spacing |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.25rem (4px) | Small elements |
| `--radius-md` | 0.5rem (8px) | Buttons, inputs |
| `--radius-lg` | 0.75rem (12px) | Cards, dialogs |
| `--radius` | 0.625rem (10px) | Default |

```jsx
// Usage
<Card className="rounded-lg" />
<Button className="rounded-md" />
<Badge className="rounded-sm" />
```

## Components

### Button

Six variants available:

| Variant | Usage |
|---------|-------|
| `default` | Primary actions |
| `secondary` | Secondary actions |
| `outline` | Tertiary actions |
| `ghost` | Subtle actions |
| `destructive` | Delete/danger actions |
| `link` | Inline links |

Three sizes:

| Size | Height | Usage |
|------|--------|-------|
| `sm` | 32px | Compact UI |
| `default` | 36px | Standard |
| `lg` | 40px | Prominent CTAs |
| `icon` | 36x36px | Icon-only buttons |

```jsx
import { Button } from '@/components/ui/button';

<Button variant="default">Primary</Button>
<Button variant="outline" size="sm">Small Outline</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
```

### Card

Container for grouped content with optional header/footer.

```jsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input

Standard form input with focus ring.

```jsx
import { Input } from '@/components/ui/input';

<Input type="text" placeholder="Enter text..." />
```

### Badge

Status indicators and tags.

| Variant | Usage |
|---------|-------|
| `default` | Primary badge |
| `secondary` | Neutral status |
| `outline` | Subtle indicator |
| `destructive` | Error/warning |

```jsx
import { Badge } from '@/components/ui/badge';

<Badge variant="secondary">Uploaded</Badge>
<Badge variant="destructive">Failed</Badge>
```

### Alert

Feedback messages.

| Variant | Usage |
|---------|-------|
| `default` | Informational |
| `destructive` | Error messages |

```jsx
import { Alert, AlertDescription } from '@/components/ui/alert';

<Alert variant="destructive">
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>
```

### Dialog (Organizer only)

Modal dialogs for forms and confirmations.

```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Checkbox (Organizer only)

Selection control for galleries.

```jsx
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox
  checked={isSelected}
  onCheckedChange={handleChange}
  className="h-5 w-5 bg-white border-2 border-gray-400"
/>
```

### Select (Organizer only)

Dropdown selection.

```jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## Layout Patterns

### Page Container

```jsx
<main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <div className="mx-auto max-w-7xl px-4 py-6">
    {/* Content */}
  </div>
</main>
```

### Header

```jsx
<header className="border-b bg-white/80 backdrop-blur-sm">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
    {/* Logo & Nav */}
  </div>
</header>
```

### Responsive Grid

```jsx
// Gallery grid
<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
  {/* Items */}
</div>

// Form grid
<div className="grid gap-4 sm:grid-cols-2">
  {/* Form fields */}
</div>
```

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | 0px+ | Mobile phones |
| `sm` | 640px+ | Large phones, small tablets |
| `md` | 768px+ | Tablets |
| `lg` | 1024px+ | Laptops |
| `xl` | 1280px+ | Desktops |

## Icons

Using Lucide React for consistent iconography.

```jsx
import { Camera, Download, X, ChevronLeft } from 'lucide-react';

// Standard size in buttons
<Button>
  <Download className="h-4 w-4" />
  Download
</Button>

// Larger icons for empty states
<Camera className="h-12 w-12 text-muted-foreground/50" />
```

### Common Icons Used

| Icon | Usage |
|------|-------|
| `Camera` | App branding, upload |
| `Download` | Download actions |
| `Upload` | Upload actions |
| `X` | Close, dismiss |
| `Check` | Success, selection |
| `ChevronLeft/Right` | Navigation |
| `Eye` | Preview |
| `Loader2` | Loading spinner (with `animate-spin`) |
| `Filter` | Filter controls |
| `Search` | Search inputs |
| `RefreshCw` | Refresh actions |

## Interaction Patterns

### Hover States

```jsx
// Image card with hover zoom
<img className="transition-transform group-hover:scale-105" />

// Button with overlay
<div className="opacity-0 group-hover:opacity-100 transition-opacity" />
```

### Focus States

All interactive elements use `focus-visible:ring-1 focus-visible:ring-ring` for keyboard navigation.

### Loading States

```jsx
<Button disabled>
  <Loader2 className="h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### Selection Mode (Gallery)

When items are selected:
- Checkboxes become always visible
- Clicking images toggles selection (not preview)
- Subtle overlay on all images (`bg-black/20`)
- Eye icon for preview access

### Long Press (Touch)

For touch devices, 500ms long press:
- Triggers selection mode
- Haptic feedback via `navigator.vibrate(50)`
- Cancel on touch move (scrolling)

## Accessibility

- All interactive elements are keyboard accessible
- Focus rings visible on keyboard navigation
- Proper ARIA labels on icon-only buttons
- Color contrast meets WCAG AA standards
- Touch targets minimum 44x44px on mobile

## File Structure

```
apps/web-{guest|organizer}/
├── app/
│   ├── globals.css          # Theme tokens
│   ├── layout.tsx           # Root layout with font
│   └── page.tsx             # Landing page
└── src/
    ├── components/
    │   └── ui/               # shadcn/ui components
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       └── ...
    └── lib/
        └── utils.ts          # cn() helper
```

## Adding New Components

1. Use shadcn/ui CLI when possible:
   ```bash
   npx shadcn@latest add [component]
   ```

2. Follow existing patterns:
   - Use `cva` for variants
   - Use `cn()` for class merging
   - Forward refs properly
   - Include proper TypeScript types

3. Keep components in `src/components/ui/`

4. Update this document when adding new patterns

## Dark Mode (Future)

The color system is designed to support dark mode. To implement:

1. Add dark mode colors to `globals.css`:
   ```css
   @media (prefers-color-scheme: dark) {
     @theme {
       --color-background: hsl(224 71% 4%);
       --color-foreground: hsl(210 20% 98%);
       /* ... */
     }
   }
   ```

2. Or use class-based toggling with a theme provider.
