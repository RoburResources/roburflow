import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";
import { ICONS } from "@/lib/docketIcons";

const LOGO_DARK = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/71b5125fc_03_primary_horizontal_dark_transparent.png";
const WATERMARK = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/71b5125fc_03_primary_horizontal_dark_transparent.png";

const esc = (v) => (v == null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Renders the Service Docket as an off-screen HTML node matching the locked
// Robur template, rasterises it to PNG and returns the uploaded file_url.
export async function generateServiceDocketImage(d, docNo, evidencePhotos, signatureUrl, ackName) {
  const photo = evidencePhotos && evidencePhotos[0] ? evidencePhotos[0] : null;

  const field = (icon, label, value) => `
    <div class="fld">
      <div class="ficon">${icon}</div>
      <div class="fbody">
        <div class="flbl">${esc(label)}</div>
        <div class="fline">${esc(value)}</div>
      </div>
    </div>`;

  const html = `
  <div id="robur-sd" style="width:794px;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;">
    <div style="padding:32px 36px;">

      <div class="hdr">
        <img src="${LOGO_DARK}" crossorigin="anonymous" style="height:52px;" />
        <div style="text-align:right;flex:1;padding-left:40px;">
          <div style="font-size:24px;font-weight:800;">SERVICE DOCKET</div>
          <div style="font-size:13px;color:#F5A800;font-weight:700;margin-top:2px;">Proof of Service</div>
          <div class="rule"></div>
        </div>
      </div>

      <div class="grid3" style="margin-top:26px;">
        ${field(ICONS.user, "CLIENT NAME", d.client_name)}
        ${field(ICONS.pin, "SITE ADDRESS", d.site_address)}
        ${field(ICONS.calendar, "SERVICE DATE", d.service_date)}
      </div>
      <div class="grid3" style="margin-top:22px;">
        ${field(ICONS.clipboard, "JOB NO.", d.job_no)}
        ${field(ICONS.sun, "SERVICE TYPE", d.service_type)}
        ${field(ICONS.notes, "NOTES / SERVICE DETAILS", d.notes)}
      </div>

      <div class="evtag"><span class="evtagico">${ICONS.camera}</span> SERVICE EVIDENCE</div>
      <div class="evbox">
        ${photo
          ? `<img src="${esc(photo)}" crossorigin="anonymous" class="evimg" />`
          : `<img src="${WATERMARK}" crossorigin="anonymous" class="evwm" />
             <div class="evph">
               <div class="evcam">&#128247;</div>
               <div class="evtitle">SERVICE EVIDENCE PHOTO</div>
               <div class="evhint">Insert one clear image showing the full state of a completed service.</div>
             </div>`}
      </div>

      <div class="confirm">
        <div class="cbar">
          <div class="cshield">${ICONS.shield}</div>
          <div class="ctext"><span>SERVICE</span><span>CONFIRMATION</span></div>
        </div>
        <div class="cgold"></div>
        <div class="cbody">
          <div>This is to certify that the service described above has been completed in accordance with the client's requirements and Robur Resources standard operating procedures.</div>
          <div style="font-weight:700;margin-top:6px;">Service completed safely, efficiently and to specification.</div>
        </div>
      </div>

      <div class="sig">
        <div class="sigcol sigcol-r">
          <div class="siglbl">ROBUR REPRESENTATIVE</div>
          <div class="sigwrap">${signatureUrl ? `<img src="${signatureUrl}" crossorigin="anonymous" style="height:44px;" />` : `<span class="sigscript">M. Tarzia</span>`}</div>
          <div class="sigline"></div>
          <div class="sigsub">Authorised Representative</div>
        </div>
        <div class="sigcol">
          <div class="siglbl">CLIENT ACKNOWLEDGEMENT</div>
          <div class="sigline sigline-ack"></div>
          <div class="ackrow"><span>Name</span><span class="ackval">${esc(ackName)}</span></div>
          <div class="ackrow"><span>Date</span><span class="ackval"></span></div>
          <img src="${WATERMARK}" crossorigin="anonymous" class="sigwm" />
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
    #robur-sd * { box-sizing:border-box; }
    #robur-sd .hdr { display:flex; align-items:flex-start; justify-content:space-between; }
    #robur-sd .rule { height:4px; background:#1A1A1A; margin-top:12px; margin-left:38%; position:relative; border-radius:2px; }
    #robur-sd .rule:after { content:""; position:absolute; right:0; top:0; width:52px; height:4px; background:#F5A800; border-radius:2px; }
    #robur-sd .grid3 { display:flex; gap:26px; }
    #robur-sd .grid3 .fld { flex:1; }
    #robur-sd .fld { display:flex; gap:10px; }
    #robur-sd .ficon { line-height:0; padding-top:1px; }
    #robur-sd .ficon svg { display:block; }
    #robur-sd .fbody { flex:1; }
    #robur-sd .flbl { font-size:8px; font-weight:700; letter-spacing:.4px; color:#3a3a3a; }
    #robur-sd .fline { border-bottom:1px solid #cfcfcf; margin-top:20px; min-height:16px; font-size:12px; }
    #robur-sd .evtag { display:inline-flex; align-items:center; gap:6px; background:#1A1A1A; color:#fff; font-size:9px; font-weight:700; letter-spacing:.4px; padding:7px 14px; margin-top:30px; }
    #robur-sd .evtagico { line-height:0; }
    #robur-sd .evtagico svg { display:block; width:13px; height:13px; }
    #robur-sd .evbox { position:relative; background:#f4f4f4; height:430px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    #robur-sd .evimg { width:100%; height:100%; object-fit:cover; }
    #robur-sd .evwm { position:absolute; width:340px; opacity:.06; top:50%; left:50%; transform:translate(-50%,-58%); }
    #robur-sd .evph { position:relative; text-align:center; }
    #robur-sd .evcam { color:#c4c4c4; font-size:26px; }
    #robur-sd .evtitle { color:#b0b0b0; font-size:20px; font-weight:800; letter-spacing:.5px; margin-top:6px; }
    #robur-sd .evhint { color:#bdbdbd; font-size:9px; margin-top:4px; }
    #robur-sd .confirm { display:flex; align-items:stretch; background:#1A1A1A; margin-top:20px; min-height:64px; }
    #robur-sd .cbar { display:flex; align-items:center; gap:10px; padding:0 16px; }
    #robur-sd .cshield { line-height:0; }
    #robur-sd .cshield svg { display:block; width:22px; height:22px; }
    #robur-sd .ctext { display:flex; flex-direction:column; color:#fff; font-size:11px; font-weight:800; line-height:1.25; }
    #robur-sd .cgold { width:3px; background:#F5A800; }
    #robur-sd .cbody { flex:1; background:#fff; padding:12px 18px; font-size:10px; line-height:1.5; }
    #robur-sd .sig { display:flex; margin-top:22px; }
    #robur-sd .sigcol { flex:1; position:relative; }
    #robur-sd .sigcol-r { border-right:1px solid #d7d7d7; padding-right:34px; margin-right:34px; }
    #robur-sd .siglbl { font-size:9px; font-weight:700; letter-spacing:.4px; }
    #robur-sd .sigwrap { height:52px; display:flex; align-items:flex-end; }
    #robur-sd .sigscript { font-family:'Brush Script MT',cursive; font-size:38px; line-height:1; }
    #robur-sd .sigline { border-bottom:1px solid #1A1A1A; }
    #robur-sd .sigline-ack { margin-top:52px; }
    #robur-sd .sigsub { font-size:9px; color:#666; margin-top:4px; }
    #robur-sd .ackrow { display:flex; gap:8px; font-size:9px; color:#666; margin-top:8px; }
    #robur-sd .ackrow .ackval { flex:1; border-bottom:1px solid #e2e2e2; color:#1A1A1A; font-size:11px; }
    #robur-sd .sigwm { position:absolute; right:0; bottom:0; width:120px; opacity:.06; }
    #robur-sd .dfooter { display:flex; align-items:center; justify-content:space-between; border-top:2px solid #F5A800; color:#1A1A1A; font-size:12px; padding:14px 60px; margin-top:24px; }
    #robur-sd .dfooter .fsep { width:1px; height:16px; background:#d7d7d7; }
  `;

  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;";
  holder.innerHTML = `<style>${style}</style>${html}`;
  document.body.appendChild(holder);

  try {
    const node = holder.querySelector("#robur-sd");
    await new Promise((r) => setTimeout(r, 400));
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], `service-docket-${docNo || Date.now()}.png`, { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  } finally {
    document.body.removeChild(holder);
  }
}