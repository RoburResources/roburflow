import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import { getCompanyInfo, billToBlock } from "@/lib/companyInfo";

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

// Gold contact bar used at the base of the combined DMT/MGT ticket.
function drawGoldFooter(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const barY = H - 14;
  doc.setFillColor(...GOLD);
  doc.rect(0, barY, W, 14, "F");
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const cy = barY + 9;
  doc.text("1300 005 550", 25, cy);
  doc.text("info@robur.com.au", W / 2, cy, { align: "center" });
  doc.text("robur.com.au", W - 25, cy, { align: "right" });
  // dividers
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(W * 0.32, barY + 3, W * 0.32, barY + 11);
  doc.line(W * 0.68, barY + 3, W * 0.68, barY + 11);
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

// ---------- Combined DMT + MGT (single document, two tickets) ----------
// Rebuilt to match the locked Robur DMT/MGT template exactly. Bill To is always
// Robur; Supplier is the client. Both tickets render on one A4 page.

// The "R" logo mark used across both ticket headers.
function drawLogo(doc, x, y) {
  // Gold angular "R" mark
  doc.setFillColor(...GOLD);
  doc.triangle(x, y, x + 5, y, x, y + 11, "F");
  doc.setFillColor(...BLACK);
  doc.triangle(x + 1.5, y, x + 9, y, x + 9, y + 11, "F");
  doc.setFillColor(...GOLD);
  doc.triangle(x + 5, y + 6, x + 10, y + 11, x + 4, y + 11, "F");
  // Wordmark
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("ROBUR", x + 14, y + 7);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("R E S O U R C E S", x + 15, y + 11);
}

// Header: logo left, title + "PREFIX 0001" right, black rule with a gold tail.
function drawTicketHeader(doc, y, title, prefix, docNo) {
  const W = doc.internal.pageSize.getWidth();
  drawLogo(doc, 15, y);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, W - 15, y + 4, { align: "right" });
  // "DMT 0001" — prefix black, number gold
  doc.setFontSize(19);
  const numStr = String(docNo || "0001");
  const numW = doc.getTextWidth(numStr);
  doc.setTextColor(...GOLD);
  doc.text(numStr, W - 15, y + 13, { align: "right" });
  doc.setTextColor(...BLACK);
  doc.text(`${prefix} `, W - 15 - numW, y + 13, { align: "right" });
  // Underline: long black segment + short gold tail on the right
  const lineY = y + 17;
  const startX = 100;
  const goldStart = W - 40;
  doc.setLineWidth(1.4);
  doc.setDrawColor(...BLACK);
  doc.line(startX, lineY, goldStart, lineY);
  doc.setDrawColor(...GOLD);
  doc.line(goldStart, lineY, W - 15, lineY);
  return lineY;
}

// A simple underlined field: label above, value on the ruled line below.
function fieldLine(doc, label, value, x, y, w) {
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(String(label).toUpperCase(), x, y);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(value ? String(value) : "", x + 42, y - 0.5);
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.3);
  doc.line(x + 40, y + 2, x + w, y + 2);
}

async function buildCombinedTicket(d, dmtNo, mgtNo, signatureUrl, company, client) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 15;
  const CW = W - M * 2; // content width
  const sig = signatureUrl ? await loadImage(signatureUrl) : null;

  // ================= DMT =================
  let y = drawTicketHeader(doc, 12, "DIRECT MEASUREMENT TICKET", "DMT", dmtNo || "0001");
  y += 5;
  // Gold rule under header
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 8;

  // ----- Bill To / Supplier with vertical divider -----
  const midX = W / 2;
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILL TO", M, y);
  doc.text("SUPPLIER", midX + 5, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  billToBlock(company).forEach((ln, i) => doc.text(String(ln), M, y + 6 + i * 4.5));
  const supLines = [client.client_name, client.site_address, client.contact_name, client.contact_phone].filter(Boolean);
  supLines.forEach((ln, i) => doc.text(String(ln), midX + 5, y + 6 + i * 4.5));
  // vertical divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(midX - 5, y - 2, midX - 5, y + 22);
  // underlines under each block
  doc.setDrawColor(190, 190, 190);
  doc.line(M, y + 22, midX - 12, y + 22);
  doc.line(midX + 5, y + 22, W - M, y + 22);
  y += 30;

  // ----- Line item table (6 cols) + Payment Status row -----
  const cols = ["DESCRIPTION", "QTY (NET)", "UOM", "UNIT PRICE", "EXT PRICE", "TOTAL PRICE"];
  // description wider than the rest
  const descW = CW * 0.30;
  const other = (CW - descW) / 5;
  const colX = [M];
  colX.push(M + descW);
  for (let i = 1; i < 5; i++) colX.push(colX[colX.length - 1] + other);
  const rightEdge = W - M;
  const vals = [d.description, d.qty_net, d.uom, d.unit_price, d.ext_price, d.total_price];

  const headH = 9;
  const rowH = 14;
  const payH = 10;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  // outer box
  doc.rect(M, y, CW, headH + rowH + payH);
  // header fill
  doc.setFillColor(...LIGHT);
  doc.rect(M, y, CW, headH, "F");
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  cols.forEach((c, i) => {
    const cx = i === 0 ? colX[0] + descW / 2 : colX[i] + other / 2;
    doc.text(c, cx, y + 6, { align: "center" });
  });
  // column dividers (down through header + value row)
  for (let i = 1; i < 6; i++) doc.line(colX[i], y, colX[i], y + headH + rowH);
  // row separators
  doc.line(M, y + headH, rightEdge, y + headH);
  doc.line(M, y + headH + rowH, rightEdge, y + headH + rowH);
  // values
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(vals[0] ? String(vals[0]) : "", colX[0] + 2, y + headH + 8);
  for (let i = 1; i < 6; i++) {
    doc.text(vals[i] ? String(vals[i]) : "", colX[i] + other / 2, y + headH + 8, { align: "center" });
  }
  // Payment status row: label sits in the EXT PRICE column, value in TOTAL PRICE
  const payY = y + headH + rowH;
  doc.line(colX[4], payY, colX[4], payY + payH);
  doc.line(colX[5], payY, colX[5], payY + payH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("PAYMENT STATUS", colX[4] + other / 2, payY + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(d.payment_status ? String(d.payment_status) : "", colX[5] + other / 2, payY + 6, { align: "center" });
  y += headH + rowH + payH + 8;

  // ----- Left field list  |  Right weight summary table -----
  const leftY = y;
  const leftFields = [
    ["FROM LOCATION", d.from_location],
    ["TO LOCATION", d.to_location],
    ["GOODS WEIGHED", d.goods_weighed],
    ["REFERENCE", d.reference],
    ["DRIVER", d.driver],
  ];
  const leftW = midX - 5 - M;
  leftFields.forEach((f, i) => fieldLine(doc, f[0], f[1], M, leftY + 4 + i * 9, leftW));

  // internal note (italic grey)
  const noteY = leftY + 4 + leftFields.length * 9 + 3;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.text("Internal Robur Resources measurement record.", M, noteY);
  doc.text("Generated for collection, delivery, grading and", M, noteY + 3.5);
  doc.text("payment reconciliation purposes.", M, noteY + 7);

  // Weight summary table on right
  const wx = midX + 5;
  const ww = W - M - wx;
  const wsRows = [
    ["Gross", d.weight_gross],
    ["Tare", d.weight_tare],
    ["Front Axle", d.weight_front_axle],
    ["Rear Axle", d.weight_rear_axle],
    ["Net Weight", d.weight_net],
  ];
  const c1 = ww * 0.48;
  const c2 = ww * 0.26;
  const wsHeadH = 8;
  const wsRowH = 9;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.setFillColor(...LIGHT);
  doc.rect(wx, leftY, ww, wsHeadH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("WEIGHT SUMMARY", wx + 2, leftY + 5.5);
  doc.text("TONNES", wx + c1 + c2 / 2, leftY + 5.5, { align: "center" });
  doc.text("DATE / TIME", wx + c1 + c2 + (ww - c1 - c2) / 2, leftY + 5.5, { align: "center" });
  wsRows.forEach((r, i) => {
    const ry = leftY + wsHeadH + i * wsRowH;
    doc.rect(wx, ry, ww, wsRowH);
    doc.line(wx + c1, ry, wx + c1, ry + wsRowH);
    doc.line(wx + c1 + c2, ry, wx + c1 + c2, ry + wsRowH);
    if (r[0] === "Net Weight") { doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); }
    else { doc.setTextColor(...BLACK); doc.setFont("helvetica", "normal"); }
    doc.setFontSize(8);
    doc.text(r[0].toUpperCase(), wx + 2, ry + 6);
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.text(r[1] ? String(r[1]) : "", wx + c1 + c2 / 2, ry + 6, { align: "center" });
    if (i === wsRows.length - 1) doc.text(d.weight_datetime || "", wx + c1 + c2 + (ww - c1 - c2) / 2, ry + 6, { align: "center" });
  });

  // ----- Driver / Authorised By row -----
  y = leftY + wsHeadH + wsRows.length * wsRowH + 12;
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DRIVER", M, y);
  doc.text("AUTHORISED BY", midX + 5, y);
  if (sig) { try { doc.addImage(sig, "PNG", M + 30, y - 6, 45, 12); } catch { /* ignore */ } }
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.line(M, y + 3, midX - 12, y + 3);
  doc.line(midX + 5, y + 3, W - M, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.text("Authorised By", midX + 45, y + 6.5);
  y += 10;

  // ===== Divider between the two tickets =====
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(M, y, W - M, y);
  doc.setLineDashPattern([], 0);
  y += 7;

  // ================= MGT =================
  y = drawTicketHeader(doc, y, "MATERIAL GRADING TICKET", "MGT", mgtNo || "0001") + 6;

  // ----- Top grid: Date | Service  ||  Customer / Site -----
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  const gridTop = y;
  const gridH = 22;
  const leftHalf = midX - 5 - M;
  // Left cell (Date + Service)
  doc.rect(M, gridTop, leftHalf, gridH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("DATE", M + 3, gridTop + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(d.date ? String(d.date) : "", M + 3, gridTop + 11);
  doc.setDrawColor(190, 190, 190);
  doc.line(M + 3, gridTop + 13, M + leftHalf * 0.45, gridTop + 13);
  // vertical split inside left cell
  doc.setDrawColor(180, 180, 180);
  doc.line(M + leftHalf * 0.5, gridTop, M + leftHalf * 0.5, gridTop + gridH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("SERVICE", M + leftHalf * 0.5 + 3, gridTop + 5);
  const svc = [["Pickup", d.service_pickup], ["Swap", d.service_swap], ["Deliver", d.service_deliver]];
  svc.forEach((s, i) => {
    const sx = M + leftHalf * 0.5 + 3;
    const sy = gridTop + 9 + i * 4.5;
    doc.setDrawColor(...BLACK);
    doc.rect(sx, sy, 3, 3);
    if (s[1]) { doc.setFillColor(...GOLD); doc.rect(sx, sy, 3, 3, "F"); }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text(s[0], sx + 5, sy + 2.7);
  });
  // Right cell: Customer / Site
  doc.setDrawColor(180, 180, 180);
  doc.rect(midX + 5, gridTop, W - M - (midX + 5), gridH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CUSTOMER / SITE", midX + 8, gridTop + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(d.customer_site ? String(d.customer_site) : "", midX + 8, gridTop + 13);
  doc.setDrawColor(190, 190, 190);
  doc.line(midX + 8, gridTop + 15, W - M - 3, gridTop + 15);
  y = gridTop + gridH;

  // ----- Weights table (left)  ||  Address/Driver/Vehicle (right) -----
  const secTop = y;
  const secH = 30;
  const wLeftW = leftHalf;
  // weights table
  doc.setDrawColor(180, 180, 180);
  doc.rect(M, secTop, wLeftW, secH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("WEIGHTS (TONNES)", M + 3, secTop + 5);
  const mgtRows = [["Gross", d.weight_gross], ["Tare", d.weight_tare], ["Net", d.weight_net]];
  const mgtLabelW = wLeftW * 0.4;
  const mRowH = 7.5;
  const mStart = secTop + 7.5;
  doc.line(M + mgtLabelW, mStart, M + mgtLabelW, secTop + secH);
  mgtRows.forEach((r, i) => {
    const ry = mStart + i * mRowH;
    doc.setDrawColor(200, 200, 200);
    doc.line(M, ry + mRowH, M + wLeftW, ry + mRowH);
    if (r[0] === "Net") { doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); }
    else { doc.setTextColor(...BLACK); doc.setFont("helvetica", "normal"); }
    doc.setFontSize(8.5);
    doc.text(r[0], M + 3, ry + 5);
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.text(r[1] ? String(r[1]) : "", M + mgtLabelW + 3, ry + 5);
  });
  // right cell fields
  const rx = midX + 5;
  const rw = W - M - rx;
  doc.setDrawColor(180, 180, 180);
  doc.rect(rx, secTop, rw, secH);
  const rfields = [
    ["ADDRESS / SITE", d.address_site],
    ["DRIVER NAME", d.driver_name],
    ["VEHICLE REGO", d.vehicle_rego],
  ];
  rfields.forEach((f, i) => {
    const fy = secTop + 6 + i * 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BLACK);
    doc.text(f[0], rx + 3, fy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(f[1] ? String(f[1]) : "", rx + 3, fy + 5);
    doc.setDrawColor(200, 200, 200);
    doc.line(rx + 3, fy + 6.5, rx + rw - 3, fy + 6.5);
  });
  y = secTop + secH;

  // ----- Payment / Amount / Recorded By (left)  ||  Material Grade (right) -----
  const pTop = y;
  const pH = 22;
  doc.setDrawColor(180, 180, 180);
  doc.rect(M, pTop, wLeftW, pH);
  const pfields = [["PAYMENT", d.payment], ["AMOUNT (AUD)", d.amount_aud], ["RECORDED BY", d.recorded_by]];
  pfields.forEach((f, i) => {
    const fy = pTop + 6 + i * 6.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BLACK);
    doc.text(f[0], M + 3, fy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(f[1] ? String(f[1]) : "", M + 42, fy);
    doc.setDrawColor(210, 210, 210);
    doc.line(M + 40, fy + 1.5, M + wLeftW - 3, fy + 1.5);
  });
  // right: material grade
  doc.setDrawColor(180, 180, 180);
  doc.rect(rx, pTop, rw, pH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("MATERIAL GRADE / PRODUCT DESCRIPTION", rx + 3, pTop + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const mgLines = doc.splitTextToSize(d.material_grade || "", rw - 6);
  doc.text(mgLines.slice(0, 3), rx + 3, pTop + 12);
  y = pTop + pH;

  // ----- Contamination / deductions / comments -----
  const cTop = y;
  const cH = 18;
  doc.setDrawColor(180, 180, 180);
  doc.rect(M, cTop, CW, cH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("CONTAMINATION / DEDUCTIONS / COMMENTS", M + 3, cTop + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const cLines = doc.splitTextToSize(d.contamination || "", CW - 8);
  doc.text(cLines.slice(0, 2), M + 3, cTop + 11);
  y = cTop + cH;

  // ----- Document ID / Version / Authorised By -----
  const fTop = y;
  const fH = 18;
  const third = CW / 3;
  doc.setDrawColor(180, 180, 180);
  doc.rect(M, fTop, CW, fH);
  doc.line(M + third, fTop, M + third, fTop + fH);
  doc.line(M + third * 2, fTop, M + third * 2, fTop + fH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("DOCUMENT ID", M + 3, fTop + 6);
  doc.text("VERSION", M + third + 3, fTop + 6);
  doc.text("AUTHORISED BY", M + third * 2 + 3, fTop + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`MGT ${mgtNo || "0001"}`, M + 3, fTop + 13);
  doc.text(String(d.version || "1.0"), M + third + 3, fTop + 13);
  if (sig) { try { doc.addImage(sig, "PNG", M + third * 2 + 3, fTop + 7, 40, 10); } catch { /* ignore */ } }
  doc.setDrawColor(200, 200, 200);
  doc.line(M + 3, fTop + 10, M + third - 3, fTop + 10);
  doc.line(M + third + 3, fTop + 10, M + third * 2 - 3, fTop + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GREY);
  doc.text("Authorised By", M + third * 2 + 25, fTop + 15);

  drawGoldFooter(doc);
  return uploadPdf(doc, `ticket-${dmtNo || Date.now()}.pdf`);
}

// Generates PDFs for the required document types.
// DMT and MGT are rendered together on a single combined ticket, so the first
// of the two encountered triggers it and the second is skipped.
export async function generateDocumentPdf(docType, data, docNo, evidencePhotos, signatureUrl, ackName, extras = {}) {
  if (docType === "service_docket") return buildServiceDocket(data, docNo, evidencePhotos, signatureUrl, ackName);
  if (docType === "dmt" || docType === "mgt") {
    const company = extras.company || (await getCompanyInfo());
    const client = extras.client || {};
    return buildCombinedTicket(data, extras.dmtNo || docNo, extras.mgtNo || docNo, signatureUrl, company, client);
  }
  return null;
}