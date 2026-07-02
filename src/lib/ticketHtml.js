import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";

const LOGO_DARK = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/71b5125fc_03_primary_horizontal_dark_transparent.png";

const esc = (v) => (v == null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Renders the combined DMT + MGT ticket as an off-screen HTML node, rasterises
// it with html2canvas, and returns a single-page A4 PDF file_url. HTML gives us
// pixel-accurate borders/spacing matching the locked Robur template.
export async function buildCombinedTicketHtml(d, dmtNo, mgtNo, signatureUrl, company, client) {
  const supplier = [client.client_name, client.site_address, client.contact_name, client.contact_phone]
    .filter(Boolean).map((l) => `<div>${esc(l)}</div>`).join("");
  const billTo = [company.company_name, company.company_abn ? `ABN ${company.company_abn}` : "", company.company_address, company.company_email]
    .filter(Boolean).map((l) => `<div>${esc(l)}</div>`).join("");

  const chk = (on) => `<span class="chk">${on ? "&#10003;" : ""}</span>`;

  const html = `
  <div id="robur-ticket" style="width:794px;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;">
    <div style="padding:28px 32px;">

      <!-- ============ DMT ============ -->
      <div class="hdr">
        <img src="${LOGO_DARK}" crossorigin="anonymous" style="height:44px;" />
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:800;letter-spacing:.3px;">DIRECT MEASUREMENT TICKET</div>
          <div style="font-size:26px;font-weight:800;">DMT <span style="color:#F5A800;">${esc(dmtNo || "0001")}</span></div>
          <div class="rule"></div>
        </div>
      </div>
      <div class="goldline"></div>

      <div class="two" style="margin-top:14px;">
        <div class="cell-r">
          <div class="lbl">BILL TO</div><div class="val">${billTo}</div>
        </div>
        <div>
          <div class="lbl">SUPPLIER</div><div class="val">${supplier}</div>
        </div>
      </div>

      <table class="tbl" style="margin-top:16px;">
        <tr>
          <th style="width:30%;">DESCRIPTION</th><th>QTY (NET)</th><th>UOM</th>
          <th>UNIT PRICE</th><th>EXT PRICE</th><th>TOTAL PRICE</th>
        </tr>
        <tr class="tall">
          <td>${esc(d.description)}</td><td>${esc(d.qty_net)}</td><td>${esc(d.uom)}</td>
          <td>${esc(d.unit_price)}</td><td>${esc(d.ext_price)}</td><td>${esc(d.total_price)}</td>
        </tr>
        <tr>
          <td class="nob"></td><td class="nob"></td><td class="nob"></td><td class="nob"></td>
          <td class="pstat">PAYMENT STATUS</td><td>${esc(d.payment_status)}</td>
        </tr>
      </table>

      <div class="two" style="margin-top:16px;align-items:flex-start;">
        <div class="cell-r">
          ${["FROM LOCATION|from_location","TO LOCATION|to_location","GOODS WEIGHED|goods_weighed","REFERENCE|reference","DRIVER|driver"]
            .map((f) => { const [l, k] = f.split("|"); return `<div class="fld"><span class="fl">${l}</span><span class="fv">${esc(d[k])}</span></div>`; }).join("")}
          <div class="note">Internal Robur Resources measurement record.<br/>Generated for collection, delivery, grading and<br/>payment reconciliation purposes.</div>
        </div>
        <div>
          <table class="tbl">
            <tr><th style="width:48%;text-align:left;padding-left:8px;">WEIGHT SUMMARY</th><th>TONNES</th><th>DATE / TIME</th></tr>
            <tr><td class="wl">Gross</td><td>${esc(d.weight_gross)}</td><td></td></tr>
            <tr><td class="wl">Tare</td><td>${esc(d.weight_tare)}</td><td></td></tr>
            <tr><td class="wl">Front Axle</td><td>${esc(d.weight_front_axle)}</td><td></td></tr>
            <tr><td class="wl">Rear Axle</td><td>${esc(d.weight_rear_axle)}</td><td></td></tr>
            <tr><td class="wl" style="color:#F5A800;font-weight:700;">NET WEIGHT</td><td>${esc(d.weight_net)}</td><td>${esc(d.weight_datetime)}</td></tr>
          </table>
        </div>
      </div>

      <div class="two sig" style="margin-top:22px;">
        <div class="cell-r">
          <div class="sigline"></div><div class="siglbl">DRIVER</div>
        </div>
        <div>
          <div class="sigwrap">${signatureUrl ? `<img src="${signatureUrl}" crossorigin="anonymous" style="height:34px;" />` : ""}</div>
          <div class="sigline"></div><div class="siglbl">AUTHORISED BY</div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- ============ MGT ============ -->
      <div class="hdr" style="margin-top:8px;">
        <img src="${LOGO_DARK}" crossorigin="anonymous" style="height:40px;" />
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:800;">MATERIAL GRADING TICKET</div>
          <div style="font-size:24px;font-weight:800;">MGT <span style="color:#F5A800;">${esc(mgtNo || "0001")}</span></div>
          <div class="rule"></div>
        </div>
      </div>

      <table class="grid" style="margin-top:14px;">
        <tr>
          <td style="width:26%;"><div class="gl">DATE</div><div class="gv">${esc(d.date)}</div></td>
          <td style="width:26%;">
            <div class="gl">SERVICE</div>
            <div class="svc">${chk(d.service_pickup)} Pickup</div>
            <div class="svc">${chk(d.service_swap)} Swap</div>
            <div class="svc">${chk(d.service_deliver)} Deliver</div>
          </td>
          <td><div class="gl">CUSTOMER / SITE</div><div class="gv">${esc(d.customer_site)}</div></td>
        </tr>
      </table>

      <table class="grid nt">
        <tr>
          <td style="width:52%;padding:0;">
            <table class="inner">
              <tr><th colspan="2" style="text-align:left;">WEIGHTS (TONNES)</th></tr>
              <tr><td class="wl2">Gross</td><td>${esc(d.weight_gross)}</td></tr>
              <tr><td class="wl2">Tare</td><td>${esc(d.weight_tare)}</td></tr>
              <tr><td class="wl2" style="color:#F5A800;font-weight:700;">Net</td><td>${esc(d.weight_net)}</td></tr>
            </table>
          </td>
          <td style="vertical-align:top;">
            ${["ADDRESS / SITE|address_site","DRIVER NAME|driver_name","VEHICLE REGO|vehicle_rego"]
              .map((f) => { const [l, k] = f.split("|"); return `<div class="rfld"><div class="gl">${l}</div><div class="rfv">${esc(d[k])}</div></div>`; }).join("")}
          </td>
        </tr>
      </table>

      <table class="grid nt">
        <tr>
          <td style="width:52%;vertical-align:top;">
            ${["PAYMENT|payment","AMOUNT (AUD)|amount_aud","RECORDED BY|recorded_by"]
              .map((f) => { const [l, k] = f.split("|"); return `<div class="pfld"><span class="pl">${l}</span><span class="pv">${esc(d[k])}</span></div>`; }).join("")}
          </td>
          <td style="vertical-align:top;">
            <div class="gl">MATERIAL GRADE / PRODUCT DESCRIPTION</div>
            <div class="gv" style="min-height:36px;">${esc(d.material_grade)}</div>
          </td>
        </tr>
      </table>

      <table class="grid nt">
        <tr><td><div class="gl">CONTAMINATION / DEDUCTIONS / COMMENTS</div><div class="gv" style="min-height:24px;">${esc(d.contamination)}</div></td></tr>
      </table>

      <table class="grid nt">
        <tr>
          <td style="width:33.3%;"><div class="gl">DOCUMENT ID</div><div class="gv">MGT ${esc(mgtNo || "0001")}</div></td>
          <td style="width:33.3%;"><div class="gl">VERSION</div><div class="gv">${esc(d.version || "1.0")}</div></td>
          <td><div class="gl">AUTHORISED BY</div><div class="gv">${signatureUrl ? `<img src="${signatureUrl}" crossorigin="anonymous" style="height:26px;" />` : ""}</div></td>
        </tr>
      </table>
    </div>

    <!-- Gold footer bar -->
    <div class="footer">
      <span>&#9742;&nbsp; 1300 005 550</span>
      <span class="fsep"></span>
      <span>&#9993;&nbsp; info@robur.com.au</span>
      <span class="fsep"></span>
      <span>&#127760;&nbsp; robur.com.au</span>
    </div>
  </div>`;

  const style = `
    #robur-ticket * { box-sizing:border-box; }
    #robur-ticket .hdr { display:flex; align-items:flex-end; justify-content:space-between; }
    #robur-ticket .rule { height:5px; background:#1A1A1A; margin-top:6px; position:relative; }
    #robur-ticket .rule:after { content:""; position:absolute; right:0; top:0; width:36px; height:5px; background:#F5A800; }
    #robur-ticket .goldline { height:2px; background:#F5A800; margin-top:12px; }
    #robur-ticket .two { display:flex; gap:0; }
    #robur-ticket .two > div { flex:1; }
    #robur-ticket .cell-r { border-right:1px solid #d7d7d7; padding-right:20px; margin-right:20px; }
    #robur-ticket .lbl { font-size:10px; font-weight:700; letter-spacing:.4px; }
    #robur-ticket .val { border-bottom:1px solid #bdbdbd; min-height:40px; padding-top:6px; font-size:12px; line-height:1.35; }
    #robur-ticket table.tbl { width:100%; border-collapse:collapse; }
    #robur-ticket table.tbl th { border:1px solid #b5b5b5; background:#f4f4f4; font-size:9px; font-weight:700; padding:6px 2px; text-align:center; }
    #robur-ticket table.tbl td { border:1px solid #b5b5b5; font-size:11px; padding:5px 6px; text-align:center; height:24px; }
    #robur-ticket table.tbl td.wl { text-align:left; padding-left:8px; }
    #robur-ticket table.tbl tr.tall td { height:34px; }
    #robur-ticket table.tbl td.nob { border-left:none; border-bottom:none; }
    #robur-ticket table.tbl td.pstat { font-weight:700; font-size:9px; }
    #robur-ticket .fld { display:flex; align-items:flex-end; margin-bottom:11px; }
    #robur-ticket .fld .fl { font-size:10px; font-weight:700; width:110px; }
    #robur-ticket .fld .fv { flex:1; border-bottom:1px solid #bdbdbd; font-size:12px; min-height:15px; padding-bottom:1px; }
    #robur-ticket .note { font-size:9px; font-style:italic; color:#8a8a8a; margin-top:6px; line-height:1.5; }
    #robur-ticket .sig .sigwrap { height:34px; }
    #robur-ticket .sig .sigline { border-bottom:1px solid #7a7a7a; margin-top:26px; }
    #robur-ticket .sig .siglbl { font-size:10px; font-weight:700; margin-top:4px; }
    #robur-ticket .divider { border-top:2px dashed #9a9a9a; margin:22px 0 0; }
    #robur-ticket table.grid { width:100%; border-collapse:collapse; }
    #robur-ticket table.grid.nt { border-top:none; }
    #robur-ticket table.grid > tbody > tr > td { border:1px solid #b5b5b5; padding:6px 8px; vertical-align:top; }
    #robur-ticket .gl { font-size:9px; font-weight:700; letter-spacing:.3px; }
    #robur-ticket .gv { font-size:12px; padding-top:8px; }
    #robur-ticket .svc { font-size:11px; margin-top:3px; }
    #robur-ticket .chk { display:inline-block; width:11px; height:11px; border:1px solid #1A1A1A; text-align:center; line-height:11px; font-size:9px; margin-right:4px; vertical-align:middle; }
    #robur-ticket table.inner { width:100%; border-collapse:collapse; }
    #robur-ticket table.inner th { border:1px solid #b5b5b5; font-size:9px; font-weight:700; padding:5px 8px; }
    #robur-ticket table.inner td { border:1px solid #b5b5b5; font-size:11px; padding:5px 8px; }
    #robur-ticket table.inner td.wl2 { width:45%; }
    #robur-ticket .rfld { margin-bottom:9px; }
    #robur-ticket .rfld .rfv { border-bottom:1px solid #ccc; font-size:12px; min-height:14px; padding-top:3px; }
    #robur-ticket .pfld { display:flex; align-items:flex-end; margin-bottom:9px; }
    #robur-ticket .pfld .pl { font-size:9px; font-weight:700; width:110px; }
    #robur-ticket .pfld .pv { flex:1; border-bottom:1px solid #ccc; font-size:12px; min-height:13px; }
    #robur-ticket .footer { display:flex; align-items:center; justify-content:space-between; background:#F5A800; color:#1A1A1A; font-size:12px; font-weight:700; padding:12px 40px; }
    #robur-ticket .footer .fsep { width:1px; height:16px; background:#1A1A1A; }
  `;

  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;";
  holder.innerHTML = `<style>${style}</style>${html}`;
  document.body.appendChild(holder);

  try {
    const node = holder.querySelector("#robur-ticket");
    await new Promise((r) => setTimeout(r, 350)); // let images load
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], `ticket-${dmtNo || Date.now()}.png`, { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  } finally {
    document.body.removeChild(holder);
  }
}