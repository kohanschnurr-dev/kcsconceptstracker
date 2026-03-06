

## Fix Dashboard Link in Sidebar and Mobile Nav

The sidebar and mobile hamburger nav have the Dashboard path set to `/` (the landing page) instead of `/dashboard` (the actual app dashboard).

### Changes

**1. `src/components/layout/Sidebar.tsx` (line 46)**
- Change `path: '/'` to `path: '/dashboard'` for the Dashboard nav item

**2. `src/components/layout/MobileNav.tsx` (line 38)**
- Change `path: '/'` to `path: '/dashboard'` for the Dashboard nav item

Two lines, two files.

