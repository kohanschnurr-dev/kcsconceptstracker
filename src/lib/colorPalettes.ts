export type PaletteKey = 'ember' | 'ocean' | 'forest' | 'amethyst' | 'steel';

export interface Palette {
  key: PaletteKey;
  name: string;
  variables: Record<string, string>;
}

const shared = {
  '--foreground': '210 20% 95%',
  '--card-foreground': '210 20% 95%',
  '--popover-foreground': '210 20% 95%',
  '--primary-foreground': '220 20% 10%',
  '--secondary-foreground': '210 20% 90%',
  '--muted-foreground': '215 15% 55%',
  '--accent-foreground': '220 20% 10%',
  '--destructive': '0 72% 51%',
  '--destructive-foreground': '210 40% 98%',
  '--success': '142 76% 36%',
  '--success-foreground': '210 40% 98%',
  '--warning': '45 93% 47%',
  '--warning-foreground': '220 20% 10%',
  '--radius': '0.5rem',
  '--sidebar-foreground': '210 20% 90%',
  '--sidebar-accent-foreground': '210 20% 90%',
};

export const palettes: Palette[] = [
  {
    key: 'ember',
    name: 'Ember',
    variables: {
      ...shared,
      '--background': '220 20% 10%',
      '--card': '220 18% 13%',
      '--popover': '220 18% 13%',
      '--primary': '32 95% 55%',
      '--secondary': '220 15% 20%',
      '--muted': '220 15% 18%',
      '--accent': '32 90% 50%',
      '--border': '220 15% 22%',
      '--input': '220 15% 22%',
      '--ring': '32 95% 55%',
      '--chart-1': '32 95% 55%',
      '--chart-2': '142 76% 36%',
      '--chart-3': '0 72% 51%',
      '--chart-4': '200 80% 50%',
      '--chart-5': '270 60% 55%',
      '--sidebar-background': '220 20% 8%',
      '--sidebar-primary': '32 95% 55%',
      '--sidebar-primary-foreground': '220 20% 10%',
      '--sidebar-accent': '220 15% 15%',
      '--sidebar-border': '220 15% 18%',
      '--sidebar-ring': '32 95% 55%',
    },
  },
  {
    key: 'ocean',
    name: 'Ocean',
    variables: {
      ...shared,
      '--background': '222 47% 9%',
      '--card': '222 40% 12%',
      '--popover': '222 40% 12%',
      '--primary': '217 91% 60%',
      '--secondary': '222 30% 20%',
      '--muted': '222 25% 18%',
      '--accent': '217 85% 55%',
      '--border': '222 25% 22%',
      '--input': '222 25% 22%',
      '--ring': '217 91% 60%',
      '--chart-1': '217 91% 60%',
      '--chart-2': '142 76% 36%',
      '--chart-3': '0 72% 51%',
      '--chart-4': '180 70% 50%',
      '--chart-5': '270 60% 55%',
      '--sidebar-background': '222 47% 7%',
      '--sidebar-primary': '217 91% 60%',
      '--sidebar-primary-foreground': '220 20% 10%',
      '--sidebar-accent': '222 30% 15%',
      '--sidebar-border': '222 25% 18%',
      '--sidebar-ring': '217 91% 60%',
    },
  },
  {
    key: 'forest',
    name: 'Forest',
    variables: {
      ...shared,
      '--background': '160 20% 8%',
      '--card': '160 15% 11%',
      '--popover': '160 15% 11%',
      '--primary': '160 84% 39%',
      '--secondary': '160 15% 20%',
      '--muted': '160 12% 18%',
      '--accent': '160 80% 35%',
      '--border': '160 12% 22%',
      '--input': '160 12% 22%',
      '--ring': '160 84% 39%',
      '--chart-1': '160 84% 39%',
      '--chart-2': '45 93% 47%',
      '--chart-3': '0 72% 51%',
      '--chart-4': '200 80% 50%',
      '--chart-5': '270 60% 55%',
      '--sidebar-background': '160 20% 6%',
      '--sidebar-primary': '160 84% 39%',
      '--sidebar-primary-foreground': '220 20% 10%',
      '--sidebar-accent': '160 12% 15%',
      '--sidebar-border': '160 12% 18%',
      '--sidebar-ring': '160 84% 39%',
    },
  },
  {
    key: 'amethyst',
    name: 'Amethyst',
    variables: {
      ...shared,
      '--background': '270 25% 9%',
      '--card': '270 20% 12%',
      '--popover': '270 20% 12%',
      '--primary': '263 70% 50%',
      '--secondary': '270 18% 20%',
      '--muted': '270 15% 18%',
      '--accent': '263 65% 45%',
      '--border': '270 15% 22%',
      '--input': '270 15% 22%',
      '--ring': '263 70% 50%',
      '--chart-1': '263 70% 50%',
      '--chart-2': '142 76% 36%',
      '--chart-3': '0 72% 51%',
      '--chart-4': '200 80% 50%',
      '--chart-5': '32 95% 55%',
      '--sidebar-background': '270 25% 7%',
      '--sidebar-primary': '263 70% 50%',
      '--sidebar-primary-foreground': '220 20% 10%',
      '--sidebar-accent': '270 15% 15%',
      '--sidebar-border': '270 15% 18%',
      '--sidebar-ring': '263 70% 50%',
    },
  },
  {
    key: 'steel',
    name: 'Steel',
    variables: {
      ...shared,
      '--background': '220 15% 9%',
      '--card': '220 12% 12%',
      '--popover': '220 12% 12%',
      '--primary': '215 20% 65%',
      '--secondary': '220 10% 20%',
      '--muted': '220 10% 18%',
      '--accent': '215 15% 60%',
      '--border': '220 10% 22%',
      '--input': '220 10% 22%',
      '--ring': '215 20% 65%',
      '--chart-1': '215 20% 65%',
      '--chart-2': '142 76% 36%',
      '--chart-3': '0 72% 51%',
      '--chart-4': '200 80% 50%',
      '--chart-5': '32 95% 55%',
      '--sidebar-background': '220 15% 7%',
      '--sidebar-primary': '215 20% 65%',
      '--sidebar-primary-foreground': '220 20% 10%',
      '--sidebar-accent': '220 10% 15%',
      '--sidebar-border': '220 10% 18%',
      '--sidebar-ring': '215 20% 65%',
    },
  },
];

const STORAGE_KEY = 'kcs-color-palette';

export function getActivePalette(): PaletteKey {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && palettes.some((p) => p.key === stored)) {
      return stored as PaletteKey;
    }
  } catch {}
  return 'ember';
}

export function applyPalette(key: PaletteKey) {
  const palette = palettes.find((p) => p.key === key);
  if (!palette) return;
  const root = document.documentElement;
  Object.entries(palette.variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {}
}
