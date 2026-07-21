// Collision-safe atomic numbering for RoburFlow.
//
// Guarantees:
// - Independent DMT / MGT / DSS sequences.
// - Atomic allocation via optimistic concurrency (compare-and-set on lock_version);
//   two concurrent reservers can never receive the same number.
// - Deterministic idempotent retries: the same idempotency_key always maps to the
//   same reserved number (looked up from the append-only receipts), so a retried
//   request never burns a second number.
// - No number reuse: numbers only ever move forward.
// - No direct client writes: all state changes run under the service role, inside
//   the backend function that imports this module.
// - Fail-closed baseline: reservation is refused until baseline_verified is true.
// - Append-only audit: a NumberReservation receipt is written for every reserve
//   and every commit; receipts are never mutated or deleted.

export const SEQUENCES = {
  dmt: { prefix: "DMT" },
  mgt: { prefix: "MGT" },
  dss: { prefix: "DSS" },
};

const MAX_ATTEMPTS = 8;
const PAD = 4;

export function isValidSequence(sequence) {
  return Object.prototype.hasOwnProperty.call(SEQUENCES, sequence);
}

export function formatNumber(sequence, num) {
  const prefix = SEQUENCES[sequence].prefix;
  return `${prefix} ${String(num).padStart(PAD, "0")}`;
}

async function loadSequence(base44, sequence) {
  const rows = await base44.asServiceRole.entities.NumberSequence.filter({ sequence });
  return rows[0] || null;
}

// Reserve the next number for a sequence. Idempotent on idempotency_key.
// Returns { number, formatted, reused }.
export async function reserveNumber(base44, { sequence, idempotencyKey, actor, jobId, detail }) {
  if (!isValidSequence(sequence)) {
    throw new Error(`Unknown sequence: ${sequence}`);
  }
  if (!idempotencyKey) {
    throw new Error("idempotencyKey is required for deterministic reservations");
  }

  // Deterministic replay: if we already reserved for this key, return that number.
  const priorReserve = await base44.asServiceRole.entities.NumberReservation.filter({
    sequence,
    idempotency_key: idempotencyKey,
    event: "reserve",
  });
  if (priorReserve.length > 0) {
    const r = priorReserve[0];
    return { number: r.number, formatted: r.formatted, reused: true };
  }

  // Fail-closed baseline gate.
  const seq = await loadSequence(base44, sequence);
  if (!seq) {
    throw new Error(`Sequence '${sequence}' is not initialised. Baseline must be established before numbers can be released.`);
  }
  if (!seq.baseline_verified) {
    throw new Error(`Sequence '${sequence}' baseline is not verified. Production number release is blocked (fail-closed).`);
  }

  // Compare-and-set loop: advance last_reserved atomically.
  let attempt = 0;
  let lastErr = null;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const current = await loadSequence(base44, sequence);
    const nextNum = Math.max(current.last_reserved || 0, current.last_issued || 0) + 1;
    const expectedVersion = current.lock_version || 0;

    // Re-check idempotency inside the loop in case a concurrent request for the
    // same key committed between our first check and now.
    const raceCheck = await base44.asServiceRole.entities.NumberReservation.filter({
      sequence,
      idempotency_key: idempotencyKey,
      event: "reserve",
    });
    if (raceCheck.length > 0) {
      const r = raceCheck[0];
      return { number: r.number, formatted: r.formatted, reused: true };
    }

    // Attempt the guarded write: only succeeds if lock_version is unchanged.
    const affected = await base44.asServiceRole.entities.NumberSequence.updateMany(
      { id: current.id, lock_version: expectedVersion },
      { $set: { last_reserved: nextNum, lock_version: expectedVersion + 1 } }
    );

    const changed = affected?.modified_count ?? affected?.matched_count ?? affected?.count ?? (affected ? 1 : 0);
    if (!changed) {
      // Lost the race — someone else advanced the version. Retry.
      lastErr = new Error("concurrent-write");
      continue;
    }

    const formatted = formatNumber(sequence, nextNum);
    // Append-only receipt for the reservation.
    await base44.asServiceRole.entities.NumberReservation.create({
      sequence,
      idempotency_key: idempotencyKey,
      number: nextNum,
      formatted,
      event: "reserve",
      actor_email: actor?.email || "",
      actor_name: actor?.full_name || "",
      job_id: jobId || "",
      detail: detail || "",
    });
    return { number: nextNum, formatted, reused: false };
  }
  throw new Error(`Could not reserve a ${sequence} number after ${MAX_ATTEMPTS} attempts: ${lastErr?.message || "contention"}`);
}

// Commit a previously reserved number: advance last_issued and write a commit receipt.
// Idempotent — a second commit for the same key is a no-op that returns the same number.
export async function commitNumber(base44, { sequence, idempotencyKey, actor, jobId, detail }) {
  if (!isValidSequence(sequence)) throw new Error(`Unknown sequence: ${sequence}`);

  const reserves = await base44.asServiceRole.entities.NumberReservation.filter({
    sequence,
    idempotency_key: idempotencyKey,
    event: "reserve",
  });
  if (reserves.length === 0) {
    throw new Error(`No reservation found for key '${idempotencyKey}' on sequence '${sequence}'. Reserve before commit.`);
  }
  const reservation = reserves[0];

  const priorCommit = await base44.asServiceRole.entities.NumberReservation.filter({
    sequence,
    idempotency_key: idempotencyKey,
    event: "commit",
  });
  if (priorCommit.length > 0) {
    return { number: reservation.number, formatted: reservation.formatted, reused: true };
  }

  // Advance last_issued (monotonic — never moves backward).
  let attempt = 0;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const current = await loadSequence(base44, sequence);
    const expectedVersion = current.lock_version || 0;
    const newIssued = Math.max(current.last_issued || 0, reservation.number);
    const affected = await base44.asServiceRole.entities.NumberSequence.updateMany(
      { id: current.id, lock_version: expectedVersion },
      { $set: { last_issued: newIssued, lock_version: expectedVersion + 1 } }
    );
    const changed = affected?.modified_count ?? affected?.matched_count ?? affected?.count ?? (affected ? 1 : 0);
    if (changed) break;
    if (attempt >= MAX_ATTEMPTS) throw new Error(`Could not commit ${sequence} number after ${MAX_ATTEMPTS} attempts.`);
  }

  await base44.asServiceRole.entities.NumberReservation.create({
    sequence,
    idempotency_key: idempotencyKey,
    number: reservation.number,
    formatted: reservation.formatted,
    event: "commit",
    actor_email: actor?.email || "",
    actor_name: actor?.full_name || "",
    job_id: jobId || "",
    detail: detail || "",
  });
  return { number: reservation.number, formatted: reservation.formatted, reused: false };
}