import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';
import { palettes, applyPalette, getActivePalette, type PaletteKey } from '@/lib/colorPalettes';
import { cn } from '@/lib/utils';

export default function ColorPaletteCard() {
  const [active, setActive] = useState<PaletteKey>(getActivePalette);

  const handleSelect = (key: PaletteKey) => {
    applyPalette(key);
    setActive(key);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Palette
        </CardTitle>
        <CardDescription>Choose a theme for the entire app</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {palettes.map((p) => {
            const bg = `hsl(${p.variables['--background']})`;
            const primary = `hsl(${p.variables['--primary']})`;
            const card = `hsl(${p.variables['--card']})`;
            const isActive = active === p.key;

            return (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all duration-150 hover:shadow-md hover:shadow-primary/10',
                  isActive
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-muted-foreground/40'
                )}
              >
                <div className="flex w-full h-8 rounded-md overflow-hidden border border-border/50">
                  <div className="flex-1" style={{ backgroundColor: bg }} />
                  <div className="flex-1" style={{ backgroundColor: primary }} />
                  <div className="flex-1" style={{ backgroundColor: card }} />
                </div>
                <span className="text-xs font-medium text-foreground">{p.name}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
