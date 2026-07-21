import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { SEQUENCES, isValidSequence } from '../../shared/numbering.ts';

// Admin-only, fail-closed baseline initialization for the numbering sequences.
//
// It NEVER guesses a baseline. It derives the last-issued number for each sequence
// from two independent sources and requires them to agree before marking the
// sequence baseline_verified:
//   1. the highest number actually present on issued JobDocument records, and
//   2. the legacy Counter value (the old client-side counter).
// If they disagree, the sequence stays baseline_verified=false and number release
// remains blocked until a human reconciles it. Existing records are preserved.
//
// GET  -> report current state + computed baselines (dry run, mutates nothing).
// POST -> create/update sequences to the verified baseline (idempotent).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Map each sequence to the doc_no prefixes that represent it in history.
    const HISTORY_PREFIXES = {
      dmt: ['DMT'],
      mgt: ['MGT'],
      dss: ['DSS', 'Settlement', 'SS'],
    };
    const COUNTER_KEYS = { dmt: 'dmt', mgt: 'mgt', dss: 'dss' };

    // Pull all issued documents (paginate to be safe).
    const docs: Array<{ doc_no?: string }> = [];
    let skip = 0;
    const pageSize = 200;
    while (true) {
      const page = await base44.asServiceRole.entities.JobDocument.list('-created_date', pageSize, skip);
      docs.push(...page);
      if (page.length < pageSize) break;
      skip += pageSize;
    }
    const counters = await base44.asServiceRole.entities.Counter.list();
    const counterByKey: Record<string, number> = {};
    for (const c of counters) counterByKey[c.key] = c.value || 0;

    function highestFromDocs(prefixes: string[]) {
      let max = 0;
      for (const d of docs) {
        const no = String(d.doc_no || '');
        for (const p of prefixes) {
          const m = no.match(new RegExp('^' + p + '\\s*0*(\\d+)', 'i'));
          if (m) { const v = parseInt(m[1], 10); if (v > max) max = v; }
        }
      }
      return max;
    }

    const report: Record<string, unknown> = {};
    const apply = req.method === 'POST';

    for (const sequence of Object.keys(SEQUENCES)) {
      if (!isValidSequence(sequence)) continue;
      const docsMax = highestFromDocs(HISTORY_PREFIXES[sequence]);
      const counterVal = counterByKey[COUNTER_KEYS[sequence]] ?? 0;

      // Both sources must agree. dss legitimately starts at 0 (no history, no counter).
      const sourcesAgree = docsMax === counterVal;
      const baseline = docsMax; // last actually-issued number
      const existing = await base44.asServiceRole.entities.NumberSequence.filter({ sequence });
      const already = existing[0];

      let status = 'unchanged';
      let verified = sourcesAgree;

      if (apply && sourcesAgree) {
        const payload = {
          sequence,
          prefix: SEQUENCES[sequence].prefix,
          last_issued: baseline,
          last_reserved: Math.max(baseline, already?.last_reserved || 0),
          baseline_verified: true,
          baseline_note: `Verified ${new Date().toISOString()}: docs=${docsMax}, counter=${counterVal} agree.`,
          lock_version: (already?.lock_version || 0) + (already ? 1 : 0),
        };
        if (already) {
          await base44.asServiceRole.entities.NumberSequence.update(already.id, payload);
          status = 'updated';
        } else {
          await base44.asServiceRole.entities.NumberSequence.create(payload);
          status = 'created';
        }
      } else if (apply && !sourcesAgree) {
        // Fail-closed: create/leave the sequence unverified so release stays blocked.
        if (!already) {
          await base44.asServiceRole.entities.NumberSequence.create({
            sequence,
            prefix: SEQUENCES[sequence].prefix,
            last_issued: baseline,
            last_reserved: baseline,
            baseline_verified: false,
            baseline_note: `BLOCKED ${new Date().toISOString()}: docs=${docsMax} vs counter=${counterVal} disagree. Manual reconciliation required.`,
            lock_version: 0,
          });
          status = 'created-blocked';
        } else {
          status = 'left-blocked';
        }
        verified = false;
      }

      report[sequence] = { docsMax, counterVal, sourcesAgree, baseline, baseline_verified: verified, status };
    }

    return Response.json({ mode: apply ? 'apply' : 'dry-run', report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});