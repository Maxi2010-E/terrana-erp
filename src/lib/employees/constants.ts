export const EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "on_leave",
  "archived",
] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  archived: "Archived",
};

export const EMPLOYEE_DEPARTMENTS = [
  "administration",
  "accounts",
  "inventory",
  "logistics",
  "processing",
  "packaging",
] as const;

export type EmployeeDepartment = (typeof EMPLOYEE_DEPARTMENTS)[number];

export const EMPLOYEE_DEPARTMENT_LABELS: Record<EmployeeDepartment, string> = {
  administration: "Administration",
  accounts: "Accounts",
  inventory: "Inventory",
  logistics: "Logistics",
  processing: "Processing",
  packaging: "Packaging",
};

export const EMPLOYEE_TYPES = ["administrative", "field_staff"] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  administrative: "Administrative",
  field_staff: "Field Staff",
};

export const PAGE_SIZE = 25;
