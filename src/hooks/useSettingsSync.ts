import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * All localStorage keys that should be synced across devices via the database.
 */
const SETTINGS_KEYS = [
  'custom-calendar-categories',
  'custom-budget-categories',
  'custom-monthly-categories',
  'custom-business-categories',
  'procurement-source-stores',
  'custom-property-info-fields',
  'kcs-color-palette',
  'custom-trade-groups',
  'trade-groups-order',
  'dashboard-profit-filters',
];

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Call this after any settings localStorage write to trigger a debounced DB sync. */
export function triggerSettingsSync() {
  window.dispatchEvent(new Event('settings-changed'));
}

/**
 * Hook that syncs all settings between localStorage and the database.
 * On login: seeds localStorage from DB (so settings follow the user across devices).
 * On change: debounced write of all settings to DB.
 */
export function useSettingsSync() {
  const { user } = useAuth();
  const loadedRef = useRef(false);

  // Load from DB on mount
  useEffect(() => {
    if (!user || loadedRef.current) return;

    const load = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('settings_data')
          .eq('user_id', user.id)
          .maybeSingle();

        const settings = (data as any)?.settings_data as Record<string, unknown> | null;

        if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
          // Seed localStorage from DB
          for (const key of SETTINGS_KEYS) {
            if (settings[key] !== undefined) {
              const val = settings[key];
              localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            }
          }

          // Re-apply color palette
          if (typeof settings['kcs-color-palette'] === 'string') {
            import('@/lib/colorPalettes').then(({ applyPalette, palettes }) => {
              const key = settings['kcs-color-palette'] as string;
              if (palettes.some(p => p.key === key)) {
                applyPalette(key as any);
              }
            });
          }

          // Notify hooks to re-read from localStorage
          window.dispatchEvent(new Event('settings-synced'));
        } else {
          // First time or empty: migrate current localStorage to DB
          syncToCloud(user.id);
        }
      } catch (e) {
        console.error('Failed to load settings from cloud:', e);
      }
      loadedRef.current = true;
    };

    load();
  }, [user]);

  // Listen for settings changes and debounce-sync to cloud
  useEffect(() => {
    if (!user) return;

    const handleChange = () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => syncToCloud(user.id), 1000);
    };

    window.addEventListener('settings-changed', handleChange);
    return () => window.removeEventListener('settings-changed', handleChange);
  }, [user]);
}

async function syncToCloud(userId: string) {
  try {
    const settings: Record<string, unknown> = {};
    for (const key of SETTINGS_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        if (key === 'kcs-color-palette') {
          settings[key] = raw; // plain string
        } else {
          try {
            settings[key] = JSON.parse(raw);
          } catch {
            settings[key] = raw;
          }
        }
      }
    }

    await supabase
      .from('profiles')
      .update({ settings_data: settings } as any)
      .eq('user_id', userId);
  } catch (e) {
    console.error('Failed to sync settings to cloud:', e);
  }
}
