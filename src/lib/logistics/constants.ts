export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const FUMIGATION_REQUIREMENTS = [
  "requires_fumigation",
  "no_fumigation_required",
] as const;
export type FumigationRequirement = (typeof FUMIGATION_REQUIREMENTS)[number];

export const SHIPMENT_STATUSES = ["loaded", "in_transit", "delivered"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const FUMIGATION_REQUIREMENT_LABELS: Record<FumigationRequirement, string> =
  {
    requires_fumigation: "Requires fumigation",
    no_fumigation_required: "No fumigation required",
  };

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  loaded: "Loaded",
  in_transit: "In transit",
  delivered: "Delivered",
};

export const CUSTOMER_TABS = ["overview", "shipments"] as const;
export type CustomerTab = (typeof CUSTOMER_TABS)[number];

export const CUSTOMER_TAB_LABELS: Record<CustomerTab, string> = {
  overview: "Overview",
  shipments: "Shipments",
};
