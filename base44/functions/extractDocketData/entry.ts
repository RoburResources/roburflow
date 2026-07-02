import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Extracts structured field data from photos of physical dockets/tickets and
// uploaded files, using a Hugging Face vision model via the user's connected
// Hugging Face account. Returns a flat object of { fieldKey: value } scoped to
// the requested document type.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileUrls, docType, fields } = await req.json();
    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return Response.json({ error: 'No fields provided' }, { status: 400 });
    }

    // Describe the exact keys we can map back into the form.
    const fieldList = fields
      .map((f: { key: string; label: string; type?: string }) =>
        `- ${f.key}: ${f.label} (${f.type === 'checkbox' ? 'boolean true/false' : 'string'})`)
      .join('\n');
    const emptyExample: Record<string, unknown> = {};
    for (const f of fields) emptyExample[f.key] = f.type === 'checkbox' ? false : '';

    const prompt = `You are reading a physical "${docType}" ticket/docket for Robur Resources, a materials logistics company in Australia.
Extract every value you can clearly read from the attached image(s) and map it to the correct field.
Only fill a field if you are reasonably confident. Leave a field as an empty string (or false for checkboxes) if it is not present or unreadable.
Weights are in tonnes, currency is AUD. Preserve numbers exactly as written.

Return ONLY a valid JSON object (no markdown, no commentary) with exactly these keys:
${fieldList}

If nothing is readable, return this: ${JSON.stringify(emptyExample)}`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('hugging_face');

    // Vision chat model on HF Inference Providers. Images passed as image_url.
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];
    for (const url of fileUrls) {
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
        max_tokens: 1024,
        temperature: 0,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return Response.json({ error: `Hugging Face error: ${errText}` }, { status: 502 });
    }

    const hfJson = await hfRes.json();
    const raw = hfJson?.choices?.[0]?.message?.content ?? '{}';

    // Parse the model output, tolerating stray markdown fences.
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(raw);
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});