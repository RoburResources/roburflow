import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Extracts structured field data from photos of physical dockets/tickets and
// uploaded files, using the platform's vision LLM. Returns a flat object of
// { fieldKey: value } scoped to the requested document type.
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

    // Build a JSON schema from the requested fields so the model returns exactly
    // the keys we can map back into the form.
    const properties: Record<string, unknown> = {};
    const fieldList: string[] = [];
    for (const f of fields) {
      properties[f.key] = {
        type: f.type === 'checkbox' ? 'boolean' : 'string',
        description: f.label,
      };
      fieldList.push(`${f.key} (${f.label})`);
    }

    const prompt = `You are reading a physical "${docType}" ticket/docket for Robur Resources, a materials logistics company in Australia.
Extract every value you can clearly read from the attached image(s)/file(s) and map it to the correct field.
Only fill a field if you are reasonably confident. Leave a field as an empty string (or false for checkboxes) if it is not present or unreadable.
Weights are in tonnes, currency is AUD. Preserve numbers exactly as written.

Fields to extract:
${fieldList.join('\n')}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: 'object',
        properties,
      },
    });

    return Response.json({ data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});