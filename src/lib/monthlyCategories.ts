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

export const getMonthlyCategoryLabel = (value: string): string => {
  const found = MONTHLY_COST_CATEGORIES.find(c => c.value === value);
  if (found) return found.label;
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
