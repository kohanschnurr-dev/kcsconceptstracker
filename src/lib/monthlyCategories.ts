export const MONTHLY_COST_CATEGORIES = [
  { value: 'water', label: 'Water' },
  { value: 'gas', label: 'Gas' },
  { value: 'electric', label: 'Electric' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'hoa', label: 'HOA' },
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'lawn_care', label: 'Lawn Care' },
  { value: 'pool_maintenance', label: 'Pool Maintenance' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'internet_cable', label: 'Internet / Cable' },
  { value: 'trash_recycling', label: 'Trash / Recycling' },
  { value: 'security_alarm', label: 'Security / Alarm' },
];

// Dynamic getter that checks localStorage first
export function getMonthlyCategories(): typeof MONTHLY_COST_CATEGORIES {
  try {
    const saved = localStorage.getItem('custom-monthly-categories');
    if (saved) return (JSON.parse(saved) as typeof MONTHLY_COST_CATEGORIES).sort((a, b) => a.label.localeCompare(b.label));
  } catch (e) {
    console.error('Error loading custom monthly categories:', e);
  }
  return [...MONTHLY_COST_CATEGORIES].sort((a, b) => a.label.localeCompare(b.label));
}

export const getMonthlyCategoryLabel = (value: string): string => {
  const found = getMonthlyCategories().find(c => c.value === value);
  if (found) return found.label;
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
