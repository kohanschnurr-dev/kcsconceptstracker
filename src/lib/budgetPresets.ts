export interface CategoryPreset {
  category: string;
  label: string;
  pricePerSqft: number;
  mode: 'psf' | 'flat';
}

export const DEFAULT_CATEGORY_PRESETS: CategoryPreset[] = [
  { category: 'painting', label: 'Painting', pricePerSqft: 3.50, mode: 'psf' },
  { category: 'flooring', label: 'Flooring', pricePerSqft: 8.00, mode: 'psf' },
  { category: 'tile', label: 'Tile', pricePerSqft: 12.00, mode: 'psf' },
  { category: 'drywall', label: 'Drywall', pricePerSqft: 2.50, mode: 'psf' },
  { category: 'roofing', label: 'Roofing', pricePerSqft: 5.00, mode: 'psf' },
];

export const PRESETS_STORAGE_KEY = 'budget-category-presets';
