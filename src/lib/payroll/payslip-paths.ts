export function payslipStreamPath(lineId: string): string {
  return `/api/hr/payroll/lines/${lineId}/payslip`;
}
