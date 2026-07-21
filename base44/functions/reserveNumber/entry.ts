import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { reserveNumber, commitNumber, isValidSequence, SEQUENCES } from '../../shared/numbering.ts';

// Authenticated, backend-only atomic number reservation for DMT / MGT / DSS.
// The frontend never writes sequence state directly — it can only call this,
// which runs the guarded compare-and-set logic under the service role.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action = 'reserve', sequence, idempotencyKey, jobId, detail } = body;

    if (!isValidSequence(sequence)) {
      return Response.json({ error: `Invalid sequence. Expected one of: ${Object.keys(SEQUENCES).join(', ')}` }, { status: 400 });
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return Response.json({ error: 'idempotencyKey (string) is required' }, { status: 400 });
    }

    const actor = { email: user.email, full_name: user.full_name };

    if (action === 'reserve') {
      const result = await reserveNumber(base44, { sequence, idempotencyKey, actor, jobId, detail });
      return Response.json(result);
    }
    if (action === 'commit') {
      const result = await commitNumber(base44, { sequence, idempotencyKey, actor, jobId, detail });
      return Response.json(result);
    }
    return Response.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (error) {
    // Fail-closed: any baseline / contention error surfaces as an error, never a number.
    return Response.json({ error: error.message }, { status: 409 });
  }
});