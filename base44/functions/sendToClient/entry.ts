import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Emails a client the completed, branded documents for a job.
// Admin-only. Marks the job as "sent".
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { jobId, message } = await req.json();
    if (!jobId) return Response.json({ error: 'jobId required' }, { status: 400 });

    const job = await base44.asServiceRole.entities.Job.get(jobId);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (!job.client_email) {
      return Response.json({ error: 'This job has no client email address.' }, { status: 400 });
    }

    const docs = await base44.asServiceRole.entities.JobDocument.filter({ job_id: jobId });
    const links = docs
      .filter((d) => d.pdf_url)
      .map((d) => `<li><a href="${d.pdf_url}">${(d.doc_type || '').toUpperCase()} ${d.doc_no || ''}</a></li>`)
      .join('');

    const body = `
      <div style="font-family: Arial, sans-serif; color: #1A1A1A; max-width: 600px;">
        <div style="border-bottom: 3px solid #F5A800; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0;">ROBUR <span style="color:#F5A800;">RESOURCES</span></h2>
        </div>
        <p>Dear ${job.client_name || 'Valued Client'},</p>
        <p>${message || 'Please find your completed documents for the recent job below.'}</p>
        ${links ? `<p><strong>Documents:</strong></p><ul>${links}</ul>` : '<p>Documents are attached to this job record.</p>'}
        <p style="margin-top: 24px;">Thank you for your business.</p>
        <p style="color:#666; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px;">
          Robur Resources &bull; 1300 005 550 &bull; info@robur.com.au &bull; robur.com.au
        </p>
      </div>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'Robur Resources',
      to: job.client_email,
      subject: `Robur Resources — Documents for ${job.job_no || job.client_name}`,
      body,
    });

    await base44.asServiceRole.entities.Job.update(jobId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});