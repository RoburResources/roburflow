// Field definitions for each document type. Drives dynamic form rendering,
// AI extraction targets, and PDF layout.

export const DOC_TYPE_LABELS = {
  service_docket: "Service Docket",
  dmt: "Direct Measurement Ticket",
  mgt: "Material Grading Ticket",
  settlement_summary: "Daily Settlement Summary",
};

export const DOC_TYPE_SHORT = {
  service_docket: "Service Docket",
  dmt: "DMT",
  mgt: "MGT",
  settlement_summary: "Settlement",
};

// Service Docket fields
export const SERVICE_DOCKET_FIELDS = [
  { key: "client_name", label: "Client Name", type: "text" },
  { key: "site_address", label: "Site Address", type: "text" },
  { key: "service_date", label: "Service Date", type: "date" },
  { key: "job_no", label: "Job No", type: "text" },
  { key: "service_type", label: "Service Type", type: "text" },
  { key: "notes", label: "Notes / Service Details", type: "textarea" },
];

// Direct Measurement Ticket fields
export const DMT_FIELDS = [
  { key: "bill_to", label: "Bill To", type: "text" },
  { key: "supplier", label: "Supplier", type: "text" },
  { key: "description", label: "Description", type: "text" },
  { key: "qty_net", label: "Qty (Net)", type: "text" },
  { key: "uom", label: "UOM", type: "text" },
  { key: "unit_price", label: "Unit Price", type: "text" },
  { key: "ext_price", label: "Ext Price", type: "text" },
  { key: "total_price", label: "Total Price", type: "text" },
  { key: "payment_status", label: "Payment Status", type: "text" },
  { key: "from_location", label: "From Location", type: "text" },
  { key: "to_location", label: "To Location", type: "text" },
  { key: "goods_weighed", label: "Goods Weighed", type: "text" },
  { key: "reference", label: "Reference", type: "text" },
  { key: "driver", label: "Driver", type: "text" },
  { key: "weight_gross", label: "Gross (Tonnes)", type: "text" },
  { key: "weight_tare", label: "Tare (Tonnes)", type: "text" },
  { key: "weight_front_axle", label: "Front Axle (Tonnes)", type: "text" },
  { key: "weight_rear_axle", label: "Rear Axle (Tonnes)", type: "text" },
  { key: "weight_net", label: "Net Weight (Tonnes)", type: "text" },
  { key: "weight_datetime", label: "Weigh Date / Time", type: "text" },
];

// Material Grading Ticket fields
export const MGT_FIELDS = [
  { key: "date", label: "Date", type: "date" },
  { key: "service_pickup", label: "Service: Pickup", type: "checkbox" },
  { key: "service_swap", label: "Service: Swap", type: "checkbox" },
  { key: "service_deliver", label: "Service: Deliver", type: "checkbox" },
  { key: "customer_site", label: "Customer / Site", type: "text" },
  { key: "address_site", label: "Address / Site", type: "text" },
  { key: "driver_name", label: "Driver Name", type: "text" },
  { key: "vehicle_rego", label: "Vehicle Rego", type: "text" },
  { key: "material_grade", label: "Material Grade / Product Description", type: "textarea" },
  { key: "weight_gross", label: "Gross (Tonnes)", type: "text" },
  { key: "weight_tare", label: "Tare (Tonnes)", type: "text" },
  { key: "weight_net", label: "Net (Tonnes)", type: "text" },
  { key: "amount_aud", label: "Amount (AUD)", type: "text" },
  { key: "recorded_by", label: "Recorded By", type: "text" },
  { key: "contamination", label: "Contamination / Deductions / Comments", type: "textarea" },
];

export const DOC_FIELDS = {
  service_docket: SERVICE_DOCKET_FIELDS,
  dmt: DMT_FIELDS,
  mgt: MGT_FIELDS,
};

export function getDocFields(docType) {
  return DOC_FIELDS[docType] || [];
}