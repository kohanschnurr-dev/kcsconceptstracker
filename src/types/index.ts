export type ProjectStatus = 'active' | 'complete' | 'on-hold';

export type BudgetCategory = 
  | 'foundation'
  | 'plumbing'
  | 'hvac'
  | 'electrical'
  | 'roof'
  | 'interior'
  | 'kitchen'
  | 'fixtures';

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
  trade: BudgetCategory;
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

export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'plumbing', label: 'Cast Iron/Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'roof', label: 'Roof' },
  { value: 'interior', label: 'Interior Finish (Tile/LVP)' },
  { value: 'kitchen', label: 'Kitchen/Cabs' },
  { value: 'fixtures', label: 'Fixtures' },
];

export const TEXAS_SALES_TAX = 0.0825;
