// Illustrative appointment slots, never a claim of the host's live availability.
export const HOST_ZONE = 'America/New_York';
export const SAMPLE_TIMES = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00'];
export function dateKey(instant, timeZone) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const val = type => p.find(part => part.type === type).value;
  return `${val('year')}-${val('month')}-${val('day')}`;
}
export function addDays(key, days) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function zonedInstant(key, time, timeZone) {
  const [year, month, day] = key.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let result = wall;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(result);
    const val = type => Number(parts.find(part => part.type === type).value);
    const rendered = Date.UTC(val('year'), val('month') - 1, val('day'), val('hour'), val('minute'), val('second'));
    const correction = wall - rendered;
    result += correction;
    if (!correction) break;
  }
  return result;
}
export function sampleSlotsForDate(viewerKey, timeZone, now = Date.now()) {
  const today = dateKey(now, timeZone);
  if (viewerKey < today || viewerKey > addDays(today, 90)) return [];
  const slots = [];
  // The viewer's local day may overlap either adjacent day in Miami.
  for (const offset of [-1, 0, 1]) {
    const hostKey = addDays(viewerKey, offset);
    const weekday = new Date(`${hostKey}T12:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const time of SAMPLE_TIMES) {
      const instant = zonedInstant(hostKey, time, HOST_ZONE);
      if (instant >= now + 24 * 60 * 60 * 1000 && dateKey(instant, timeZone) === viewerKey) slots.push(instant);
    }
  }
  return [...new Set(slots)].sort((a, b) => a - b);
}
export function monthCells(year, month) {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const leading = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, i) => `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)];
}
