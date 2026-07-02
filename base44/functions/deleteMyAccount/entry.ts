import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Deletes the currently authenticated user's own account and associated data.
// Required for App Store compliance (in-app account deletion).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Remove data tied to this user where we can identify ownership.
    const svc = base44.asServiceRole;

    try {
      const expenses = await svc.entities.Expense.filter({ driver_email: user.email });
      for (const e of expenses) await svc.entities.Expense.delete(e.id);
    } catch (_e) { /* entity may not exist yet */ }

    try {
      const acks = await svc.entities.BriefingAck.filter({ driver_email: user.email });
      for (const a of acks) await svc.entities.BriefingAck.delete(a.id);
    } catch (_e) { /* ignore */ }

    // Finally delete the user record itself.
    await svc.entities.User.delete(user.id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});