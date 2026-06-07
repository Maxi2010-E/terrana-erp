import type {
  CustomerStatus,
  FumigationRequirement,
  ShipmentStatus,
} from "@/lib/logistics/constants";

export type Customer = {
  id: string;
  customer_code: string;
  customer_name: string;
  country: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  fumigation_requirement: FumigationRequirement;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerListRow = {
  id: string;
  customer_code: string;
  customer_name: string;
  country: string;
  fumigation_requirement: FumigationRequirement;
  status: CustomerStatus;
  phone: string | null;
};

export type FumigationChamber = {
  id: string;
  facility_name: string;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  registration_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FumigationChamberListRow = {
  id: string;
  facility_name: string;
  contact_person: string | null;
  phone: string | null;
  registration_number: string | null;
};

export type TruckAgent = {
  id: string;
  agent_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TruckAgentListRow = {
  id: string;
  agent_name: string;
  phone: string | null;
  email: string | null;
};

export type ShipmentInventoryLine = {
  id: string;
  inventory_batch_id: string;
  inventory_number: string;
  product_type: string;
  bags: number;
  total_kg: number;
  warehouse_lot_label?: string | null;
};

export type ShipmentLotLoadLine = ShipmentInventoryLine;

export type WarehouseLotLoadOption = {
  id: string;
  inventory_number: string;
  product_type: string;
  bags: number;
  total_kg: number;
};

export type WarehouseLotForShipmentSelect = {
  id: string;
  lot_code: string;
  label: string;
  bags_on_hand: number;
};

export type CostAllocationListRow = {
  id: string;
  shipmentId: string;
  shipmentNumber: string;
  customerName: string;
  inventoryNumber: string;
  productType: string;
  bags: number;
  totalKg: number;
  loadingDate: string;
};

export type ShipmentListRow = {
  id: string;
  shipment_number: string;
  customer_name: string;
  container_number: string;
  seal_number: string;
  total_kg: number;
  loading_date: string;
  status: ShipmentStatus;
};

export type Shipment = {
  id: string;
  shipment_number: string;
  customer_id: string;
  customer_name: string;
  customer_code: string;
  truck_agent_id: string | null;
  truck_agent_name: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  truck_plate_number: string | null;
  container_number: string;
  seal_number: string;
  destination_port: string | null;
  total_kg: number;
  loading_date: string;
  bill_of_lading: string | null;
  vessel_name: string | null;
  vessel_number: string | null;
  status: ShipmentStatus;
  notes: string | null;
  created_at: string;
  inventory_lines: ShipmentInventoryLine[];
};

export type AvailableInventoryOption = {
  id: string;
  inventory_number: string;
  product_type: string;
  bags: number;
  total_kg: number;
};

export type CustomerShipmentRow = {
  id: string;
  shipment_number: string;
  container_number: string;
  loading_date: string;
  status: ShipmentStatus;
  total_kg: number;
};
