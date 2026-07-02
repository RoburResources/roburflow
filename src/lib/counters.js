import { base44 } from "@/api/base44Client";

// Atomically-ish get the next number for a given counter key.
// Returns a zero-padded string, e.g. "0001".
export async function nextNumber(key, pad = 4) {
  const existing = await base44.entities.Counter.filter({ key });
  let counter = existing[0];
  let value;
  if (counter) {
    value = (counter.value || 0) + 1;
    await base44.entities.Counter.update(counter.id, { value });
  } else {
    value = 1;
    await base44.entities.Counter.create({ key, value });
  }
  return String(value).padStart(pad, "0");
}