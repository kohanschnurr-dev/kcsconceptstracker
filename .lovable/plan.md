

## Plan: Make "Features" nav link scroll to PlatformOverview section

**Two changes needed:**

1. **`src/components/landing/PlatformOverview.tsx`** — Add `id="platform"` to the outer `<section>` element so it can be targeted by a hash link.

2. **`src/components/landing/LandingHeader.tsx`** — Change the Features nav link from `href: "/features"` to `href: "/#platform"`, and add scroll logic. When on the landing page (`/`), clicking Features should smooth-scroll to `#platform`. When on another page, it should navigate to `/#platform` and then scroll after load. The mobile drawer link should also work the same way.

