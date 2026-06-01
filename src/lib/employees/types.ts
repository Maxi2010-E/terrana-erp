import type {
  EmployeeDepartment,
  EmployeeStatus,
  EmployeeType,
} from "@/lib/employees/constants";

export type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  hire_date: string;
  status: EmployeeStatus;
  employee_type: EmployeeType;
  department: EmployeeDepartment;
  job_title: string;
  monthly_salary: number;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  guarantor_address: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeListRow = Pick<
  Employee,
  | "id"
  | "employee_code"
  | "first_name"
  | "last_name"
  | "department"
  | "job_title"
  | "status"
  | "hire_date"
  | "phone"
>;

export type AppUserRow = {
  id: string;
  email: string;
  username: string | null;
  role: string;
  status: string;
  last_login: string | null;
  employee_id: string | null;
  employees: {
    employee_code: string;
    first_name: string;
    last_name: string;
  } | null;
};

export type EmployeeOption = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: EmployeeDepartment;
};
