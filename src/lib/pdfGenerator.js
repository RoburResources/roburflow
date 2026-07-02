import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";

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

// ---------- DMT ----------
async function buildDMT(d, docNo, signatureUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  drawHeader(doc, "DIRECT MEASUREMENT TICKET", null, `DMT ${docNo || "0001"}`);

  let y = 50;
  const half = (W - 30 - 10) / 2;
  labelledLine(doc, "Bill To", d.bill_to, 15, y, half);
  labelledLine(doc, "Supplier", d.supplier, 15 + half + 10, y, half);
  y += 18;

  // Line item table
  const cols = ["Description", "Qty (Net)", "UOM", "Unit Price", "Ext Price", "Total Price"];
  const vals = [d.description, d.qty_net, d.uom, d.unit_price, d.ext_price, d.total_price];
  const cw = (W - 30) / 6;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(...LIGHT);
  doc.rect(15, y, W - 30, 8, "F");
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  cols.forEach((c, i) => doc.text(c, 15 + cw * i + 2, y + 5));
  doc.rect(15, y, W - 30, 16);
  for (let i = 1; i < 6; i++) doc.line(15 + cw * i, y, 15 + cw * i, y + 16);
  doc.line(15, y + 8, W - 15, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  vals.forEach((v, i) => doc.text(v ? String(v) : "", 15 + cw * i + 2, y + 13));
  y += 22;

  doc.setTextColor(...GREY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT STATUS", 15, y);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(d.payment_status || "", 55, y);
  y += 8;

  // Left: locations. Right: weight summary
  const leftY = y;
  ["from_location", "to_location", "goods_weighed", "reference", "driver"].forEach((k, i) => {
    labelledLine(doc, k.replace(/_/g, " "), d[k], 15, leftY + i * 12, half - 5);
  });

  // Weight summary table on right
  const wx = 15 + half + 10;
  const ww = half;
  const rows = [
    ["Gross", d.weight_gross],
    ["Tare", d.weight_tare],
    ["Front Axle", d.weight_front_axle],
    ["Rear Axle", d.weight_rear_axle],
    ["Net Weight", d.weight_net],
  ];
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(...LIGHT);
  doc.rect(wx, y, ww, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("WEIGHT SUMMARY", wx + 2, y + 5);
  doc.text("TONNES", wx + ww * 0.55, y + 5);
  doc.text("DATE / TIME", wx + ww * 0.78, y + 5);
  rows.forEach((r, i) => {
    const ry = y + 7 + i * 8;
    doc.rect(wx, ry, ww, 8);
    if (r[0] === "Net Weight") {
      doc.setTextColor(...GOLD);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(...BLACK);
      doc.setFont("helvetica", "normal");
    }
    doc.setFontSize(8);
    doc.text(r[0].toUpperCase(), wx + 2, ry + 5);
    doc.setTextColor(...BLACK);
    doc.text(r[1] ? String(r[1]) : "", wx + ww * 0.55, ry + 5);
    if (i === rows.length - 1) doc.text(d.weight_datetime || "", wx + ww * 0.78, ry + 5);
    doc.line(wx + ww * 0.5, ry, wx + ww * 0.5, ry + 8);
    doc.line(wx + ww * 0.75, ry, wx + ww * 0.75, ry + 8);
  });

  y = leftY + 62;
  const sig = signatureUrl ? await loadImage(signatureUrl) : null;
  doc.setTextColor(...GREY);
  doc.setFontSize(7);
  doc.text("DRIVER", 15, y);
  doc.text("AUTHORISED BY", W / 2 + 5, y);
  if (sig) { try { doc.addImage(sig, "PNG", 15, y + 2, 50, 16); } catch { /* ignore */ } }
  doc.setDrawColor(...BLACK);
  doc.line(15, y + 20, 90, y + 20);
  doc.line(W / 2 + 5, y + 20, W - 15, y + 20);

  drawFooter(doc);
  return uploadPdf(doc, `dmt-${docNo || Date.now()}.pdf`);
}

// ---------- MGT ----------
async function buildMGT(d, docNo, signatureUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  drawHeader(doc, "MATERIAL GRADING TICKET", null, `MGT ${docNo || "0001"}`);

  let y = 50;
  const half = (W - 30 - 10) / 2;
  labelledLine(doc, "Date", d.date, 15, y, half - 30);
  // Service checkboxes
  doc.setTextColor(...GREY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("SERVICE", 15 + half - 20, y);
  const svc = [["Pickup", d.service_pickup], ["Swap", d.service_swap], ["Deliver", d.service_deliver]];
  svc.forEach((s, i) => {
    const sx = 15 + half - 20 + i * 22;
    doc.setDrawColor(...BLACK);
    doc.rect(sx, y + 3, 4, 4);
    if (s[1]) { doc.setFillColor(...GOLD); doc.rect(sx, y + 3, 4, 4, "F"); }
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(s[0], sx + 6, y + 6.5);
  });
  labelledLine(doc, "Customer / Site", d.customer_site, 15 + half + 10, y, half);
  y += 18;

  labelledLine(doc, "Address / Site", d.address_site, 15 + half + 10, y, half);
  // Weights table left
  const rows = [["Gross", d.weight_gross], ["Tare", d.weight_tare], ["Net", d.weight_net]];
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("WEIGHTS (TONNES)", 15, y);
  rows.forEach((r, i) => {
    const ry = y + 4 + i * 8;
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, ry, half - 5, 8);
    if (r[0] === "Net") { doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); }
    else { doc.setTextColor(...BLACK); doc.setFont("helvetica", "normal"); }
    doc.setFontSize(9);
    doc.text(r[0], 17, ry + 5.5);
    doc.setTextColor(...BLACK);
    doc.text(r[1] ? String(r[1]) : "", 50, ry + 5.5);
  });
  y += 30;

  labelledLine(doc, "Driver Name", d.driver_name, 15 + half + 10, y - 12, half);
  labelledLine(doc, "Vehicle Rego", d.vehicle_rego, 15 + half + 10, y, half);

  labelledLine(doc, "Amount (AUD)", d.amount_aud, 15, y, half - 5);
  y += 14;
  labelledLine(doc, "Recorded By", d.recorded_by, 15, y, half - 5);
  labelledLine(doc, "Material Grade / Product", d.material_grade, 15 + half + 10, y, half);
  y += 16;

  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CONTAMINATION / DEDUCTIONS / COMMENTS", 15, y);
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y + 3, W - 30, 16);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(d.contamination || "", W - 34);
  doc.text(lines.slice(0, 2), 17, y + 8);
  y += 26;

  const sig = signatureUrl ? await loadImage(signatureUrl) : null;
  doc.setTextColor(...GREY);
  doc.setFontSize(7);
  doc.text("AUTHORISED BY", W / 2 + 5, y);
  if (sig) { try { doc.addImage(sig, "PNG", W / 2 + 5, y + 2, 50, 16); } catch { /* ignore */ } }
  doc.setDrawColor(...BLACK);
  doc.line(W / 2 + 5, y + 20, W - 15, y + 20);

  drawFooter(doc);
  return uploadPdf(doc, `mgt-${docNo || Date.now()}.pdf`);
}

export async function generateDocumentPdf(docType, data, docNo, evidencePhotos, signatureUrl, ackName) {
  if (docType === "service_docket") return buildServiceDocket(data, docNo, evidencePhotos, signatureUrl, ackName);
  if (docType === "dmt") return buildDMT(data, docNo, signatureUrl);
  if (docType === "mgt") return buildMGT(data, docNo, signatureUrl);
  return null;
}