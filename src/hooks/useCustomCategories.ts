import { useState, useEffect, useCallback } from 'react';
import { triggerSettingsSync } from './useSettingsSync';

export interface CategoryItem {
  value: string;
  label: string;
  group?: string;
  isCustom?: boolean;
}

export type CategoryType = 'calendar' | 'budget' | 'monthly' | 'business' | 'stores' | 'propertyInfo' | 'jobInfo';

const STORAGE_KEYS: Record<CategoryType, string> = {
  calendar: 'custom-calendar-categories',
  budget: 'custom-budget-categories',
  monthly: 'custom-monthly-categories',
  business: 'custom-business-categories',
  stores: 'procurement-source-stores',
  propertyInfo: 'custom-property-info-fields',
  jobInfo: 'custom-job-info-fields',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export function useCustomCategories(type: CategoryType, defaults: CategoryItem[]) {
  const storageKey = STORAGE_KEYS[type];

  const [items, setItems] = useState<CategoryItem[]>(() =>
    loadFromStorage(storageKey, defaults).sort((a, b) => a.label.localeCompare(b.label))
  );

  useEffect(() => {
    saveToStorage(storageKey, items);
    triggerSettingsSync();
  }, [items, storageKey]);

  // Re-read from localStorage when settings are synced from cloud
  useEffect(() => {
    const handleSync = () => {
      const synced = loadFromStorage(storageKey, defaults);
      setItems(synced.sort((a: CategoryItem, b: CategoryItem) => a.label.localeCompare(b.label)));
    };
    window.addEventListener('settings-synced', handleSync);
    return () => window.removeEventListener('settings-synced', handleSync);
  }, [storageKey, defaults]);

  const addItem = useCallback((label: string, group?: string) => {
    const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (items.some(i => i.value === value)) return false;
    setItems(prev => [...prev, { value, label, group, isCustom: true }].sort((a, b) => a.label.localeCompare(b.label)));
    return true;
  }, [items]);

  const removeItem = useCallback((value: string) => {
    setItems(prev => prev.filter(i => i.value !== value));
  }, []);

  const renameItem = useCallback((oldValue: string, newLabel: string, newGroup?: string) => {
    const newValue = newLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (items.some(i => i.value === newValue && i.value !== oldValue)) return false;
    setItems(prev =>
      prev.map(i =>
        i.value === oldValue
          ? { ...i, value: newValue, label: newLabel, group: newGroup ?? i.group }
          : i
      ).sort((a, b) => a.label.localeCompare(b.label))
    );
    return true;
  }, [items]);

  const resetToDefaults = useCallback(() => {
    setItems(defaults);
  }, [defaults]);

  return { items, addItem, removeItem, renameItem, resetToDefaults };
}

// Static getters for components that don't need reactivity
export function getCustomItems(type: CategoryType, defaults: CategoryItem[]): CategoryItem[] {
  return loadFromStorage(STORAGE_KEYS[type], defaults);
}
