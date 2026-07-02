import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";

const LOGO_DARK = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/71b5125fc_03_primary_horizontal_dark_transparent.png";
const SIGNATURE = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/71b5125fc_03_primary_horizontal_dark_transparent.png";

const esc = (v) => (v == null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Renders the Daily Settlement Summary as an off-screen HTML node matching the
// locked Robur template, rasterises it to PNG and returns the uploaded file_url.
export async function generateSettlementImage(summary) {
  const fld = (label, value) => `
    <div class="sfld">
      <div class="sbar"></div>
      <div class="sbody"><div class="slbl">${esc(label)}</div><div class="sline">${esc(value)}</div></div>
    </div>`;

  const rows = (summary.line_items || []).map((it) => `
    <tr>
      <td>${esc(it.ref)}</td><td>${esc(it.material)}</td><td>${esc(it.net_weight)}</td>
      <td>${esc(it.rate)}</td><td>${esc(it.amount)}</td>
    </tr>`).join("");

  const html = `
  <div id="robur-dss" style="width:794px;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;">
    <div style="padding:34px 40px;">
      <div class="hdr">
        <img src="${LOGO_DARK}" crossorigin="anonymous" style="height:56px;" />
        <div style="text-align:right;">
          <div style="font-size:24px;font-weight:800;">DAILY SETTLEMENT SUMMARY</div>
          <div style="font-size:13px;color:#F5A800;font-weight:700;margin-top:2px;">Payment Summary</div>
          <div class="rule"></div>
          <div class="sumno"><span>SUMMARY NO.</span><span class="sumline">${esc(summary.summary_no)}</span></div>
        </div>
      </div>
      <div class="topdiv"></div>

      <div class="two" style="margin-top:20px;">
        <div class="col">
          ${fld("PAYMENT DATE", summary.payment_date)}
          ${fld("PAID TO", summary.paid_to)}
          ${fld("PAYMENT METHOD", summary.payment_method)}
        </div>
        <div class="vdiv"></div>
        <div class="col">
          ${fld("PAYMENT STATUS", summary.payment_status)}
          ${fld("PAYMENT REFERENCE", summary.payment_reference)}
          ${fld("SETTLEMENT PERIOD", summary.settlement_period)}
        </div>
      </div>

      <div class="stats">
        <div class="stat"><div class="circ">t</div><div><div class="stl">TOTAL NET WEIGHT</div><div class="stline">${esc(summary.total_net_weight)}</div></div></div>
        <div class="stat"><div class="circ">$</div><div><div class="stl">TOTAL PAYMENT (AUD)</div><div class="stline">${esc(summary.total_payment)}</div></div></div>
        <div class="stat nol"><div class="circ">&#10003;</div><div><div class="stl">TOTAL LOADS</div><div class="stline">${esc(summary.total_loads)}</div></div></div>
      </div>

      <table class="items">
        <tr><th>REF (DMT / MGT)</th><th>MATERIAL</th><th>NET WEIGHT (t)</th><th>RATE (AUD)</th><th>AMOUNT (AUD)</th></tr>
        ${rows || `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>`}
      </table>

      <div class="totalbox">
        <div class="tlabel">TOTAL PAYMENT (AUD)</div>
        <div class="tsep"></div>
        <div class="tval">${esc(summary.total_payment)}</div>
      </div>

      <div class="two footer-sec" style="margin-top:26px;">
        <div class="col ty">
          <div class="tyshield">&#128737;</div>
          <div class="tygold"></div>
          <div class="tytext">
            <div class="tyhead">THANK YOU</div>
            <div class="tysub">Thank you for your business.</div>
            <div class="tysub">Please find your DMT and MGT records attached in addition to this summary.</div>
          </div>
        </div>
        <div class="vdiv"></div>
        <div class="col">
          <div class="authlbl">AUTHORISED BY</div>
          <div class="signame" style="font-family:'Brush Script MT',cursive;font-size:34px;">M. Tarzia</div>
          <div class="authline"></div>
          <div class="authname">MICHAEL TARZIA</div>
          <div class="authsub">Authorised by</div>
        </div>
      </div>
    </div>

    <div class="dfooter">
      <span>&#9742;&nbsp; 1300 005 550</span>
      <span class="fsep"></span>
      <span>&#9993;&nbsp; info@robur.com.au</span>
      <span class="fsep"></span>
      <span>&#127760;&nbsp; robur.com.au</span>
    </div>
  </div>`;

  const style = `
    #robur-dss * { box-sizing:border-box; }
    #robur-dss .hdr { display:flex; align-items:flex-start; justify-content:space-between; }
    #robur-dss .rule { height:4px; background:#1A1A1A; margin-top:8px; position:relative; }
    #robur-dss .rule:after { content:""; position:absolute; right:0; top:0; width:44px; height:4px; background:#F5A800; }
    #robur-dss .sumno { display:flex; justify-content:flex-end; gap:8px; font-size:9px; color:#8a8a8a; margin-top:10px; align-items:flex-end; }
    #robur-dss .sumno .sumline { border-bottom:1px solid #bdbdbd; width:150px; height:14px; }
    #robur-dss .topdiv { border-top:1px solid #d7d7d7; margin-top:16px; }
    #robur-dss .two { display:flex; }
    #robur-dss .two .col { flex:1; }
    #robur-dss .two .vdiv { width:1px; background:#d7d7d7; margin:0 30px; }
    #robur-dss .sfld { display:flex; margin-bottom:26px; }
    #robur-dss .sbar { width:3px; background:#F5A800; margin-right:12px; }
    #robur-dss .sbody { flex:1; }
    #robur-dss .slbl { font-size:9px; font-weight:700; letter-spacing:.4px; }
    #robur-dss .sline { border-bottom:1px solid #cfcfcf; margin-top:14px; font-size:12px; min-height:16px; }
    #robur-dss .stats { display:flex; background:#f4f4f4; border-radius:4px; padding:18px 10px; margin-top:8px; }
    #robur-dss .stat { flex:1; display:flex; align-items:center; gap:12px; padding:0 14px; }
    #robur-dss .stat:not(.nol) { }
    #robur-dss .stat + .stat { border-left:1px solid #d7d7d7; }
    #robur-dss .circ { width:26px; height:26px; border:1.5px solid #F5A800; border-radius:50%; color:#F5A800; font-weight:700; text-align:center; line-height:24px; font-size:13px; flex-shrink:0; }
    #robur-dss .stl { font-size:8px; font-weight:700; letter-spacing:.3px; }
    #robur-dss .stline { border-bottom:1px solid #cfcfcf; margin-top:12px; min-height:14px; font-size:12px; width:150px; }
    #robur-dss table.items { width:100%; border-collapse:collapse; margin-top:26px; }
    #robur-dss table.items th { border-top:2px solid #F5A800; border-bottom:2px solid #F5A800; font-size:8px; font-weight:700; padding:6px 2px; text-align:left; }
    #robur-dss table.items td { font-size:11px; padding:14px 2px 4px; border-bottom:1px solid #e3e3e3; }
    #robur-dss .totalbox { display:flex; align-items:center; border:2px solid #F5A800; border-radius:3px; margin-top:26px; height:44px; }
    #robur-dss .tlabel { font-size:16px; font-weight:800; padding-left:18px; flex:1; }
    #robur-dss .tsep { width:1px; height:44px; background:#F5A800; }
    #robur-dss .tval { flex:1; text-align:right; padding-right:24px; font-size:16px; border-bottom:1px solid #999; margin:0 24px; }
    #robur-dss .footer-sec .ty { display:flex; align-items:flex-start; gap:8px; }
    #robur-dss .tyshield { color:#F5A800; font-size:18px; }
    #robur-dss .tygold { width:3px; align-self:stretch; background:#F5A800; }
    #robur-dss .tyhead { font-size:16px; font-weight:800; }
    #robur-dss .tysub { font-size:9px; color:#8a8a8a; margin-top:3px; }
    #robur-dss .authlbl { font-size:9px; font-weight:700; }
    #robur-dss .authline { border-bottom:1px solid #F5A800; margin-top:2px; }
    #robur-dss .authname { font-size:11px; font-weight:700; margin-top:4px; }
    #robur-dss .authsub { font-size:8px; color:#8a8a8a; }
    #robur-dss .dfooter { display:flex; align-items:center; justify-content:space-between; border-top:2px solid #F5A800; color:#1A1A1A; font-size:12px; padding:14px 60px; }
    #robur-dss .dfooter .fsep { width:1px; height:16px; background:#d7d7d7; }
  `;

  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;";
  holder.innerHTML = `<style>${style}</style>${html}`;
  document.body.appendChild(holder);

  try {
    const node = holder.querySelector("#robur-dss");
    await new Promise((r) => setTimeout(r, 350));
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], `settlement-${Date.now()}.png`, { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  } finally {
    document.body.removeChild(holder);
  }
}