

## Add Logo to Landing Header

### Change
In `src/components/landing/LandingHeader.tsx`, import the GroundWorks logo and display it next to the "GroundWorks" text in the top-left.

First, copy `user-uploads://GroundWorks_5-3.png` to `src/assets/groundworks-helmet-logo.png`.

Then update the logo `<Link>` (line 48-50) from plain text to an image + text combo:

```tsx
import groundworksLogo from "@/assets/groundworks-helmet-logo.png";

// In the JSX:
<Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
  <img src={groundworksLogo} alt="GroundWorks" className="h-8 w-8" />
  GroundWorks
</Link>
```

