import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";

const GOLD = [245, 168, 0];
const BLACK = [26, 26, 26];
const GREY = [130, 130, 130];
const LIGHT = [244, 244, 244];

function drawHeader(doc) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BLACK);
  doc.triangle(15, 14, 15, 30, 27, 22, "F");
  doc.setFillColor(...GOLD);
  doc.triangle(15, 14, 24, 14, 15, 22, "F");
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ROBUR", 32, 22);
  doc.setTextColor(...GOLD);
  doc.setFontSize(8);
  doc.text("R E S O U R C E S", 32, 27);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DAILY SETTLEMENT SUMMARY", W - 15, 20, { align: "right" });
  doc.setTextColor(...GOLD);
  doc.setFontSize(10);
  doc.text("Payment Summary", W - 15, 26, { align: "right" });
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(15, 34, W - 15, 34);
}

function statBox(doc, x, y, w, label, value) {
  doc.setFillColor(...LIGHT);
  doc.roundedRect(x, y, w, 20, 2, 2, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.circle(x + 8, y + 10, 4);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(label.toUpperCase(), x + 16, y + 8);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(String(value), x + 16, y + 15);
}

export async function generateSettlementPdf(summary) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  drawHeader(doc);

  let y = 46;
  const half = (W - 30 - 10) / 2;
  const line = (label, value, x, yy) => {
    doc.setTextColor(...GREY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), x, yy);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(x, yy + 3, x, yy + 8);
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(value ? String(value) : "", x + 3, yy + 8);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(x + 3, yy + 10, x + half, yy + 10);
  };
  line("Payment Date", summary.payment_date, 15, y);
  line("Payment Status", summary.payment_status, 15 + half + 10, y);
  y += 18;
  line("Paid To", summary.paid_to, 15, y);
  line("Payment Reference", summary.payment_reference, 15 + half + 10, y);
  y += 18;
  line("Payment Method", summary.payment_method, 15, y);
  line("Settlement Period", summary.settlement_period, 15 + half + 10, y);
  y += 18;

  const third = (W - 30) / 3;
  statBox(doc, 15, y, third - 3, "Total Net Weight", `${summary.total_net_weight} t`);
  statBox(doc, 15 + third, y, third - 3, "Total Payment (AUD)", `$${summary.total_payment}`);
  statBox(doc, 15 + third * 2, y, third - 3, "Total Loads", summary.total_loads);
  y += 28;

  // Line items
  const cols = ["Ref (DMT/MGT)", "Material", "Net Weight (t)", "Rate (AUD)", "Amount (AUD)"];
  const cw = (W - 30) / 5;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(15, y, W - 15, y);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  cols.forEach((c, i) => doc.text(c, 15 + cw * i + 1, y + 5));
  doc.line(15, y + 7, W - 15, y + 7);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  (summary.line_items || []).forEach((it) => {
    doc.setTextColor(...BLACK);
    doc.text(String(it.ref || ""), 15 + 1, y);
    doc.text(String(it.material || ""), 15 + cw + 1, y);
    doc.text(String(it.net_weight || ""), 15 + cw * 2 + 1, y);
    doc.text(String(it.rate || ""), 15 + cw * 3 + 1, y);
    doc.text(String(it.amount || ""), 15 + cw * 4 + 1, y);
    doc.setDrawColor(230, 230, 230);
    doc.line(15, y + 3, W - 15, y + 3);
    y += 8;
  });
  y += 6;

  // Total payment box
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.rect(15, y, W - 30, 16);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL PAYMENT (AUD)", 20, y + 10);
  doc.setFontSize(14);
  doc.text(`$${summary.total_payment}`, W - 20, y + 10, { align: "right" });
  doc.line(W / 2, y, W / 2, y + 16);
  y += 26;

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("THANK YOU", 30, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("Thank you for your business.", 30, y + 5);
  doc.text("Please find your DMT and MGT records for this settlement period.", 30, y + 9);

  // Footer
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...GOLD);
  doc.line(15, H - 18, W - 15, H - 18);
  doc.setTextColor(...GREY);
  doc.setFontSize(8);
  doc.text("1300 005 550", 20, H - 12);
  doc.text("info@robur.com.au", W / 2, H - 12, { align: "center" });
  doc.text("robur.com.au", W - 20, H - 12, { align: "right" });

  const blob = doc.output("blob");
  const file = new File([blob], `settlement-${Date.now()}.pdf`, { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}