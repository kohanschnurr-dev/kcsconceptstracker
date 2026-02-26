/**
 * Shared rental cash flow calculator.
 * Accepts any object with the relevant rental fields and returns annual cash flow.
 */

interface RentalProject {
  monthlyRent?: number;
  vacancyRate?: number;
  loanAmount?: number;
  interestRate?: number;
  loanTermYears?: number;
  annualPropertyTaxes?: number;
  annualInsurance?: number;
  annualHoa?: number;
  monthlyMaintenance?: number;
  managementRate?: number;
}

export function calcAnnualCashFlow(project: RentalProject): number {
  const rent = project.monthlyRent || 0;
  const vacancy = project.vacancyRate ?? 8;
  const grossIncome = rent - rent * (vacancy / 100);

  // Mortgage P&I
  const loanAmt = project.loanAmount || 0;
  const rate = (project.interestRate || 0) / 100 / 12;
  const nPay = Math.round((project.loanTermYears ?? 30) * 12);
  let mortgage = 0;
  if (loanAmt > 0 && rate > 0 && nPay > 0) {
    mortgage = loanAmt * (rate * Math.pow(1 + rate, nPay)) / (Math.pow(1 + rate, nPay) - 1);
  }

  // Operating expenses
  const monthlyTaxes = (project.annualPropertyTaxes || 0) / 12;
  const monthlyIns = (project.annualInsurance || 0) / 12;
  const monthlyHoa = (project.annualHoa || 0) / 12;
  const maint = project.monthlyMaintenance || 0;
  const mgmt = rent * ((project.managementRate ?? 10) / 100);
  const expenses = monthlyTaxes + monthlyIns + monthlyHoa + maint + mgmt;

  const monthlyCF = grossIncome - mortgage - expenses;
  return monthlyCF * 12;
}
