import { useState, useEffect } from 'react';

export interface CustomStore {
  value: string;
  label: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'procurement-source-stores';

export const DEFAULT_STORES: CustomStore[] = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'home_depot', label: 'Home Depot' },
  { value: 'lowes', label: "Lowe's" },
  { value: 'floor_decor', label: 'Floor & Decor' },
  { value: 'build', label: 'Build.com' },
  { value: 'ferguson', label: 'Ferguson' },
  { value: 'custom', label: 'Custom' },
  { value: 'other', label: 'Other' },
];

export function useCustomStores() {
  const [stores, setStores] = useState<CustomStore[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading stores from localStorage:', e);
    }
    return DEFAULT_STORES;
  });

  // Save to localStorage whenever stores change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
    } catch (e) {
      console.error('Error saving stores to localStorage:', e);
    }
  }, [stores]);

  const addStore = (label: string) => {
    const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (stores.some(s => s.value === value)) {
      return false; // Already exists
    }
    setStores(prev => [...prev, { value, label, isCustom: true }]);
    return true;
  };

  const removeStore = (value: string) => {
    setStores(prev => prev.filter(s => s.value !== value));
  };

  const resetToDefaults = () => {
    setStores(DEFAULT_STORES);
  };

  return {
    stores,
    addStore,
    removeStore,
    resetToDefaults,
  };
}
