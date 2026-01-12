export type ProjectStatus = 'active' | 'complete' | 'on-hold';

export type BudgetCategory = 
  | 'plumbing'
  | 'roofing'
  | 'misc'
  | 'flooring'
  | 'painting'
  | 'garage'
  | 'foundation_repair'
  | 'hvac'
  | 'drywall'
  | 'main_bathroom'
  | 'carpentry'
  | 'light_fixtures'
  | 'appliances'
  | 'natural_gas'
  | 'permits_inspections'
  | 'landscaping'
  | 'dumpsters_trash'
  | 'windows'
  | 'cabinets'
  | 'countertops'
  | 'bathroom'
  | 'electrical'
  | 'kitchen'
  | 'demolition'
  | 'fencing'
  | 'doors'
  | 'water_heater'
  | 'brick_siding_stucco'
  | 'framing'
  | 'hardware'
  | 'insulation'
  | 'pest_control'
  | 'pool'
  // Business expense categories
  | 'cloud_storage'
  | 'continuing_education'
  | 'crm_software'
  | 'gas_mileage'
  | 'internet_phone'
  | 'tech_equipment'
  | 'licensing_fees'
  | 'marketing_advertising'
  | 'meals_entertainment'
  | 'office_supplies'
  | 'online_courses'
  | 'postage_shipping'
  | 'professional_dues'
  | 'subscriptions'
  | 'tools_equipment_business'
  | 'travel_expenses';
// Vendor trades (subset of categories + 'general')
export type VendorTrade = 
  | 'plumbing'
  | 'roofing'
  | 'misc'
  | 'flooring'
  | 'painting'
  | 'garage'
  | 'foundation_repair'
  | 'hvac'
  | 'drywall'
  | 'main_bathroom'
  | 'carpentry'
  | 'light_fixtures'
  | 'appliances'
  | 'natural_gas'
  | 'permits_inspections'
  | 'landscaping'
  | 'dumpsters_trash'
  | 'windows'
  | 'cabinets'
  | 'countertops'
  | 'bathroom'
  | 'electrical'
  | 'kitchen'
  | 'demolition'
  | 'fencing'
  | 'doors'
  | 'water_heater'
  | 'brick_siding_stucco'
  | 'framing'
  | 'hardware'
  | 'insulation'
  | 'pest_control'
  | 'pool'
  | 'general';

export type ExpenseStatus = 'estimate' | 'actual';
export type PaymentMethod = 'cash' | 'check' | 'card' | 'transfer';

export interface Project {
  id: string;
  name: string;
  address: string;
  totalBudget: number;
  startDate: string;
  status: ProjectStatus;
  categories: CategoryBudget[];
}

export interface CategoryBudget {
  id: string;
  projectId: string;
  category: BudgetCategory;
  estimatedBudget: number;
  actualSpent: number;
}

export interface Expense {
  id: string;
  projectId: string;
  categoryId: string;
  amount: number;
  date: string;
  vendorName: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  status: ExpenseStatus;
  description: string;
  includesTax: boolean;
  taxAmount?: number;
}

export interface Vendor {
  id: string;
  name: string;
  trade: VendorTrade;
  phone: string;
  email: string;
  hasW9: boolean;
  insuranceExpiry: string;
  reliabilityRating: number;
  pricingModel: 'flat' | 'hourly';
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  contractorsOnSite: string[];
  workPerformed: string;
  issues: string;
  photoUrls: string[];
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  amount: number;
  reasonCode: 'unforeseen' | 'permit' | 'upgrade' | 'material-change';
  description: string;
  date: string;
  approved: boolean;
}

// Construction/Renovation categories
export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'misc', label: 'Misc.' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'painting', label: 'Painting' },
  { value: 'garage', label: 'Garage' },
  { value: 'foundation_repair', label: 'Foundation Repair' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'main_bathroom', label: 'Main Bathroom' },
  { value: 'carpentry', label: 'Carpentry (Trim, Baseboards, etc.)' },
  { value: 'light_fixtures', label: 'Light Fixtures' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'natural_gas', label: 'Natural Gas' },
  { value: 'permits_inspections', label: 'Permits & Inspections' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'dumpsters_trash', label: 'Dumpsters / Trash Hauling' },
  { value: 'windows', label: 'Windows' },
  { value: 'cabinets', label: 'Cabinets' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'fencing', label: 'Fencing' },
  { value: 'doors', label: 'Doors' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'brick_siding_stucco', label: 'Brick / Siding / Stucco' },
  { value: 'framing', label: 'Framing' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'pool', label: 'Pool' },
];

// Vendor trades (construction trades + general)
export const VENDOR_TRADES: { value: VendorTrade; label: string }[] = [
  ...BUDGET_CATEGORIES.map(c => ({ value: c.value as VendorTrade, label: c.label })),
  { value: 'general', label: 'General' },
];

// Business expense categories (for KCS Concepts)
export const BUSINESS_EXPENSE_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: 'cloud_storage', label: 'Cloud Storage or Backup Services' },
  { value: 'continuing_education', label: 'Continuing Education Classes' },
  { value: 'crm_software', label: 'CRM or Business Management Software' },
  { value: 'gas_mileage', label: 'Gas and Mileage Reimbursement' },
  { value: 'internet_phone', label: 'Internet and Phone Service' },
  { value: 'tech_equipment', label: 'Laptop or Tech Equipment' },
  { value: 'licensing_fees', label: 'Licensing and Renewal Fees' },
  { value: 'marketing_advertising', label: 'Marketing and Advertising' },
  { value: 'meals_entertainment', label: 'Meals and Entertainment (Client Meetings)' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'online_courses', label: 'Online Course Materials' },
  { value: 'postage_shipping', label: 'Postage and Shipping' },
  { value: 'professional_dues', label: 'Professional Membership Dues' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'tools_equipment_business', label: 'Tools and Equipment' },
  { value: 'travel_expenses', label: 'Travel Expenses (Airfare, Hotel, Rental Car)' },
];

// Helper to get all categories (for lookups)
export const ALL_CATEGORIES = [...BUDGET_CATEGORIES, ...BUSINESS_EXPENSE_CATEGORIES];

// KCS Concepts project name constant
export const KCS_CONCEPTS_PROJECT_NAME = 'KCS Concepts';

export const TEXAS_SALES_TAX = 0.0825;
