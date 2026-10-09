import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAvailability, type AgendaSnapshot } from '../lib/public-agenda-service';
import { DEFAULT_SETTINGS } from '../lib/validation';
import { query } from '../lib/database';
import { GET as disabledCron } from '../app/api/cron/route';

const snapshot: AgendaSnapshot = {
  settings: { ...DEFAULT_SETTINGS, horizonDays: 60, bufferMinutes: 15 },
  blocks: [{ startAt: '2026-11-02T14:00:00.000Z', blockedUntil: '2026-11-02T14:45:00.000Z' }],
};

test('Una sola agenda cacheada sirve zonas y meses, conservando bloqueos y reglas actuales', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  const miami = buildAvailability('2026-11', 'America/New_York', snapshot, now);
  const madrid = buildAvailability('2026-11', 'Europe/Madrid', snapshot, now);
  assert.equal(miami.slots.includes('2026-11-02T14:00:00.000Z'), false);
  assert.equal(miami.slots.includes('2026-11-02T14:45:00.000Z'), true);
  assert.deepEqual(miami.slots.filter(slot => slot.startsWith('2026-11-02')), madrid.slots.filter(slot => slot.startsWith('2026-11-02')));
  assert.equal(miami.slots.includes('2026-12-01T00:30:00.000Z'), true);
  assert.equal(madrid.slots.includes('2026-12-01T00:30:00.000Z'), false);
  assert.equal(miami.price, 4900);
  assert.equal(miami.duration, 30);
  assert.equal('adminEmail' in miami.settings, false);
  assert.ok(buildAvailability('2026-10', 'America/New_York', snapshot, now).slots.length > 0);
  assert.deepEqual(buildAvailability('2026-11', 'America/New_York', { ...snapshot, settings: { ...snapshot.settings, bookingEnabled: false } }, now).slots, []);
});

test('La caché no congela la anticipación ni vuelve a ofrecer horas pasadas', () => {
  const before = buildAvailability('2026-11', 'America/New_York', snapshot, new Date('2026-11-02T12:00:00Z'));
  const after = buildAvailability('2026-11', 'America/New_York', snapshot, new Date('2026-11-02T13:00:00Z'));
  assert.equal(before.slots.includes('2026-11-02T14:45:00.000Z'), true);
  assert.equal(after.slots.includes('2026-11-02T14:45:00.000Z'), false);
  assert.throws(() => buildAvailability('2026-13', 'America/New_York', snapshot), /Mes o zona/);
  assert.throws(() => buildAvailability('2026-11', 'no-existe', snapshot), /Mes o zona/);
});

test('El cron desactivado no toca la base y mantenimiento impide escrituras antes de conectar', async () => {
  const previous = process.env.DATABASE_MAINTENANCE;
  process.env.DATABASE_MAINTENANCE = '1';
  try {
    await assert.rejects(query('SELECT 1'), /mantenimiento/);
    const result = await disabledCron();
    assert.equal(result.status, 410);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_MAINTENANCE;
    else process.env.DATABASE_MAINTENANCE = previous;
  }
});
