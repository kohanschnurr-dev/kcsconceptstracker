import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FWLead } from './FWLeadsTable';

// Leaflet CSS must be injected once
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
// Side-effect: adds L.heatLayer
import 'leaflet.heat';

declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: Record<string, unknown>
  ): L.Layer;
}

const FW_CENTER: [number, number] = [32.7555, -97.3308];
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1100;

// Weight by recency
const recencyWeight = (dateStr: string | null): number => {
  if (!dateStr) return 1;
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 3;
  if (days <= 90) return 2;
  return 1;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface HeatmapViewProps {
  leads: FWLead[];
  onBack: () => void;
}

export function HeatmapView({ leads, onBack }: HeatmapViewProps) {
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatRef = useRef<L.Layer | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Filter to substandard building violations with addresses
  const candidates = leads.filter(
    l => !l.skipped && l.type?.toLowerCase().includes('substandard') && l.address
  );

  const geocodeAndCache = useCallback(async (
    lead: FWLead
  ): Promise<[number, number] | null> => {
    // Check cached coords first (from DB)
    const { data } = await (supabase.from('fw_code_leads' as any) as any)
      .select('lat, lng')
      .eq('id', lead.id)
      .single();
    if (data?.lat && data?.lng) return [data.lat, data.lng];

    // Geocode via Nominatim
    try {
      const query = encodeURIComponent(`${lead.address}, Fort Worth, TX`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en-US' } }
      );
      const json = await res.json();
      if (!json?.[0]) return null;
      const lat = parseFloat(json[0].lat);
      const lng = parseFloat(json[0].lon);
      if (isNaN(lat) || isNaN(lng)) return null;

      // Cache in DB (best-effort, ignore errors)
      await (supabase.from('fw_code_leads' as any) as any)
        .update({ lat, lng })
        .eq('id', lead.id);

      return [lat, lng];
    } catch {
      return null;
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: FW_CENTER,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;
    setMounted(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Once map is mounted, geocode and build heat layer
  useEffect(() => {
    if (!mounted || !mapRef.current) return;
    if (candidates.length === 0) return;

    let cancelled = false;

    const run = async () => {
      const points: Array<[number, number, number]> = [];
      const total = candidates.length;
      setProgress({ done: 0, total });

      for (let i = 0; i < total; i += BATCH_SIZE) {
        if (cancelled) break;
        const batch = candidates.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(batch.map(lead => geocodeAndCache(lead)));

        for (let j = 0; j < batch.length; j++) {
          const coords = results[j];
          if (coords) {
            const weight = recencyWeight(batch[j].open_date);
            points.push([coords[0], coords[1], weight]);
          }
        }

        setProgress({ done: Math.min(i + BATCH_SIZE, total), total });

        if (i + BATCH_SIZE < total) await sleep(BATCH_DELAY_MS);
      }

      if (cancelled || !mapRef.current) return;
      setProgress(null);

      // Remove old heat layer
      if (heatRef.current) {
        mapRef.current.removeLayer(heatRef.current);
      }

      if (points.length === 0) {
        toast({ title: 'No geocoded points', description: 'No addresses could be resolved.' });
        return;
      }

      const heat = L.heatLayer(points, {
        radius: 25,
        blur: 20,
        maxZoom: 17,
        gradient: { 0.3: '#1a3a4a', 0.5: '#0ea5e9', 0.7: '#f59e0b', 1.0: '#ef4444' },
        minOpacity: 0.4,
      });

      heat.addTo(mapRef.current);
      heatRef.current = heat;
    };

    run();
    return () => { cancelled = true; };
  }, [mounted, candidates, geocodeAndCache, toast]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onBack} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Table
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <MapPin className="h-3.5 w-3.5 text-amber-500" />
            Hot-Zone Heatmap — Substandard Building Violations
          </div>
        </div>

        {progress && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Geocoding {progress.done}/{progress.total}…
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Recent (≤30d) ×3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 31–90d ×2
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 90d+ ×1
        </span>
        <span className="ml-auto">{candidates.length} violations plotted</span>
      </div>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-lg border border-border overflow-hidden"
        style={{ height: '600px' }}
      />

      {/* Migration note */}
      <p className="text-[10px] text-muted-foreground font-mono opacity-60">
        {/* Run this migration to enable geocoding cache: */}
        {/* ALTER TABLE fw_code_leads ADD COLUMN IF NOT EXISTS lat float8, ADD COLUMN IF NOT EXISTS lng float8; */}
        Migration required: ALTER TABLE fw_code_leads ADD COLUMN IF NOT EXISTS lat float8, ADD COLUMN IF NOT EXISTS lng float8;
      </p>
    </div>
  );
}
