import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import { getCompanyInfo } from "@/lib/companyInfo";
import { buildCombinedTicketHtml } from "@/lib/ticketHtml";

const GOLD = [245, 168, 0];
const BLACK = [26, 26, 26];
const GREY = [130, 130, 130];
const LIGHT = [244, 244, 244];

async function loadImage(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawHeader(doc, title, subtitle, docNo) {
  const W = doc.internal.pageSize.getWidth();
  // Logo mark
  doc.setFillColor(...BLACK);
  doc.triangle(15, 14, 15, 30, 27, 22, "F");
  doc.setFillColor(...GOLD);
  doc.triangle(15, 14, 24, 14, 15, 22, "F");
  // Wordmark
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ROBUR", 32, 22);
  doc.setTextColor(...GOLD);
  doc.setFontSize(8);
  doc.text("R E S O U R C E S", 32, 27);
  // Title
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, W - 15, 20, { align: "right" });
  if (subtitle) {
    doc.setTextColor(...GOLD);
    doc.setFontSize(10);
    doc.text(subtitle, W - 15, 26, { align: "right" });
  }
  if (docNo) {
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(docNo, W - 15, 33, { align: "right" });
  }
  // Divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(15, 38, W - 15, 38);
}

function drawFooter(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(15, H - 18, W - 15, H - 18);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("1300 005 550", 20, H - 12);
  doc.text("info@robur.com.au", W / 2, H - 12, { align: "center" });
  doc.text("robur.com.au", W - 20, H - 12, { align: "right" });
}

function labelledLine(doc, label, value, x, y, w) {
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(String(label).toUpperCase(), x, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(x, y + 3, x, y + 8);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(value ? String(value) : "", x + 3, y + 8);
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(x + 3, y + 10, x + w, y + 10);
}

async function uploadPdf(doc, filename) {
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

// ---------- Service Docket ----------
async function buildServiceDocket(d, docNo, evidencePhotos, signatureUrl, ackName) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  drawHeader(doc, "SERVICE DOCKET", "Proof of Service", null);

  let y = 50;
  const colW = (W - 30 - 10) / 3;
  labelledLine(doc, "Client Name", d.client_name, 15, y, colW);
  labelledLine(doc, "Site Address", d.site_address, 15 + colW + 5, y, colW);
  labelledLine(doc, "Service Date", d.service_date, 15 + (colW + 5) * 2, y, colW);
  y += 18;
  labelledLine(doc, "Job No", d.job_no, 15, y, colW);
  labelledLine(doc, "Service Type", d.service_type, 15 + colW + 5, y, colW);
  labelledLine(doc, "Notes", d.notes, 15 + (colW + 5) * 2, y, colW);

  // Evidence
  y += 18;
  doc.setFillColor(...BLACK);
  doc.rect(15, y, 55, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SERVICE EVIDENCE", 18, y + 5.5);
  y += 12;
  const photo = evidencePhotos && evidencePhotos[0] ? await loadImage(evidencePhotos[0]) : null;
  doc.setFillColor(...LIGHT);
  doc.rect(15, y, W - 30, 70, "F");
  if (photo) {
    try {
      doc.addImage(photo, "JPEG", 15, y, W - 30, 70, undefined, "FAST");
    } catch { /* ignore bad image */ }
  } else {
    doc.setTextColor(...GREY);
    doc.setFontSize(10);
    doc.text("SERVICE EVIDENCE PHOTO", W / 2, y + 35, { align: "center" });
  }
  y += 78;

  // Confirmation band
  doc.setFillColor(...BLACK);
  doc.rect(15, y, 45, 16, "F");
  doc.setTextColor(...GOLD);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("SERVICE", 18, y + 7);
  doc.text("CONFIRMATION", 18, y + 11);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "This is to certify that the service described above has been completed in accordance with the",
    63, y + 6
  );
  doc.text("client's requirements and Robur Resources standard operating procedures.", 63, y + 10);
  y += 24;

  // Signatures
  const sig = signatureUrl ? await loadImage(signatureUrl) : null;
  doc.setTextColor(...GREY);
  doc.setFontSize(7);
  doc.text("ROBUR REPRESENTATIVE", 15, y);
  doc.text("CLIENT ACKNOWLEDGEMENT", W / 2 + 5, y);
  if (sig) {
    try { doc.addImage(sig, "PNG", W / 2 + 5, y + 2, 60, 20); } catch { /* ignore */ }
  }
  doc.setDrawColor(...BLACK);
  doc.line(15, y + 22, 90, y + 22);
  doc.line(W / 2 + 5, y + 24, W - 15, y + 24);
  doc.setTextColor(...BLACK);
  doc.setFontSize(9);
  doc.text(ackName || "", W / 2 + 5, y + 29);

  drawFooter(doc);
  return uploadPdf(doc, `service-docket-${docNo || Date.now()}.pdf`);
}

// Generates PDFs for the required document types.
// DMT and MGT are rendered together on a single combined ticket, so the first
// of the two encountered triggers it and the second is skipped.
export async function generateDocumentPdf(docType, data, docNo, evidencePhotos, signatureUrl, ackName, extras = {}) {
  if (docType === "service_docket") return buildServiceDocket(data, docNo, evidencePhotos, signatureUrl, ackName);
  if (docType === "dmt" || docType === "mgt") {
    const company = extras.company || (await getCompanyInfo());
    const client = extras.client || {};
    return buildCombinedTicketHtml(data, extras.dmtNo || docNo, extras.mgtNo || docNo, signatureUrl, company, client);
  }
  return null;
}