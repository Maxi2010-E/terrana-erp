export type PayslipLineItem = {
  label: string;
  amount: number;
};

export type PayslipData = {
  companyName: string;
  payPeriod: string;
  payPeriodLabel: string;
  reference: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  departmentLabel: string;
  paymentMethod: string;
  paymentDate: string;
  status: "recorded" | "paid";
  statusLabel: string;
  baseSalary: number;
  workingDaysInPeriod: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  leaveDeduction: number;
  bonusTotal: number;
  bonusItems: PayslipLineItem[];
  advanceDeduction: number;
  advanceItems: PayslipLineItem[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  generatedAtLabel: string;
};
