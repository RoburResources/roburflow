import { getCompanyInfo } from "@/lib/companyInfo";
import { buildCombinedTicketHtml } from "@/lib/ticketHtml";
import { generateServiceDocketImage } from "@/lib/serviceDocketHtml";

// Generates branded document images for the required document types.
// DMT and MGT are rendered together on a single combined ticket, so the first
// of the two encountered triggers it and the second is skipped.
export async function generateDocumentPdf(docType, data, docNo, evidencePhotos, signatureUrl, ackName, extras = {}) {
  if (docType === "service_docket") return generateServiceDocketImage(data, docNo, evidencePhotos, signatureUrl, ackName);
  if (docType === "dmt" || docType === "mgt") {
    const company = extras.company || (await getCompanyInfo());
    const client = extras.client || {};
    return buildCombinedTicketHtml(data, extras.dmtNo || docNo, extras.mgtNo || docNo, signatureUrl, company, client);
  }
  return null;
}