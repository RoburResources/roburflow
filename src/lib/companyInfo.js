import { base44 } from "@/api/base44Client";

// Robur Resources default company details (the "Bill To" party on tickets).
export const ROBUR_DEFAULTS = {
  company_name: "Robur Resources",
  company_abn: "",
  company_address: "Perth WA",
  company_phone: "1300 005 550",
  company_email: "info@robur.com.au",
};

// Loads the single AppSettings record merged over Robur defaults.
export async function getCompanyInfo() {
  try {
    const rows = await base44.entities.AppSettings.list();
    const s = rows && rows[0] ? rows[0] : {};
    return {
      company_name: s.company_name || ROBUR_DEFAULTS.company_name,
      company_abn: s.company_abn || ROBUR_DEFAULTS.company_abn,
      company_address: s.company_address || ROBUR_DEFAULTS.company_address,
      company_phone: s.company_phone || ROBUR_DEFAULTS.company_phone,
      company_email: s.company_email || ROBUR_DEFAULTS.company_email,
    };
  } catch {
    return { ...ROBUR_DEFAULTS };
  }
}

// The "Bill To" text block for DMT/MGT tickets (Robur as the buyer).
export function billToBlock(info) {
  const lines = [info.company_name];
  if (info.company_abn) lines.push(`ABN ${info.company_abn}`);
  if (info.company_address) lines.push(info.company_address);
  if (info.company_email) lines.push(info.company_email);
  return lines;
}