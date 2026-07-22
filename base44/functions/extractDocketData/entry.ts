import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Extracts structured field data from one or more uploaded files (any type) for a
// single job. Images are sent to a Hugging Face vision model; PDFs and text-like
// files have their text pulled first and sent as text context. The model maps
// everything it can read into the requested fields.
//
// Two modes:
//  - single doc type: pass { fileUrls, docType, fields }  -> returns { data: {key:value} }
//  - all docs at once: pass { fileUrls, docs: [{docType, label, fields:[...]}] }
//                       -> returns { data: { [docType]: {key:value} } }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fileUrls } = body;
    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    // Normalise to the multi-doc shape. Back-compatible with single docType calls.
    const docs = Array.isArray(body.docs) && body.docs.length > 0
      ? body.docs
      : [{ docType: body.docType, label: body.docType, fields: body.fields }];

    for (const d of docs) {
      if (!d.fields || !Array.isArray(d.fields) || d.fields.length === 0) {
        return Response.json({ error: `No fields provided for ${d.docType || 'document'}` }, { status: 400 });
      }
    }

    // Split files into images (for the vision model) and everything else (fetch text).
    const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i;
    const imageUrls: string[] = [];
    const textBlocks: string[] = [];

    for (const url of fileUrls) {
      if (IMAGE_EXT.test(url.split('?')[0])) {
        imageUrls.push(url);
        continue;
      }
      // Non-image: try to pull readable text (PDF/CSV/TXT/etc.) via ExtractDataFromUploadedFile.
      try {
        const res = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
          file_url: url,
          json_schema: { type: 'object', properties: { text: { type: 'string' } } },
        });
        const out = res?.output;
        const txt = typeof out === 'string' ? out : JSON.stringify(out ?? {});
        if (txt && txt !== '{}' && txt !== 'null') {
          textBlocks.push(`--- File: ${url.split('/').pop()?.split('?')[0]} ---\n${txt}`);
        }
      } catch {
        // If we can't read it as text and it's not an image, skip it silently.
      }
    }

    // Build the field spec for every requested doc.
    const docSpecs = docs.map((d: any) => {
      const list = d.fields
        .map((f: { key: string; label: string; type?: string }) =>
          `  - ${f.key}: ${f.label} (${f.type === 'checkbox' ? 'boolean true/false' : 'string'})`)
        .join('\n');
      return `Document "${d.docType}" (${d.label || d.docType}):\n${list}`;
    }).join('\n\n');

    // Example empty object matching the output shape.
    const emptyExample: Record<string, unknown> = {};
    for (const d of docs) {
      const obj: Record<string, unknown> = {};
      for (const f of d.fields) obj[f.key] = f.type === 'checkbox' ? false : '';
      emptyExample[d.docType] = obj;
    }

    const textContext = textBlocks.length
      ? `\n\nText extracted from non-image files:\n${textBlocks.join('\n\n')}`
      : '';

    const prompt = `You are reading job paperwork (dockets, weighbridge tickets, invoices, messages) for Robur Resources, a materials logistics company in Australia. All the attached image(s) and text below belong to ONE job. Combine information across all of them.

Extract every value you can clearly read and map it to the correct field for each document below. The same value may apply to more than one document (e.g. client name, weights) — fill it wherever it fits. Only fill a field if you are reasonably confident; otherwise leave it as an empty string (or false for checkboxes). Weights are in tonnes, currency is AUD. Preserve numbers exactly as written.

${docSpecs}
${textContext}

Return ONLY a valid JSON object (no markdown, no commentary) shaped exactly like this, with a nested object per document:
${JSON.stringify(emptyExample)}`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('hugging_face');

    const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];
    for (const url of imageUrls) {
      content.push({ type: 'image_url', image_url: { url } });
    }

    const hfRes = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-VL-8B-Instruct',
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
        max_tokens: 2048,
        temperature: 0,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return Response.json({ error: `Hugging Face error: ${errText}` }, { status: 502 });
    }

    const hfJson = await hfRes.json();
    const raw = hfJson?.choices?.[0]?.message?.content ?? '{}';

    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    // Single-doc back-compat: caller passed docType/fields, return a flat object.
    if (!Array.isArray(body.docs)) {
      const flat = parsed[body.docType] ?? parsed;
      return Response.json({ data: flat });
    }

    return Response.json({ data: parsed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});