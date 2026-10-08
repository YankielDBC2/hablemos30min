import test from 'node:test';
import assert from 'node:assert/strict';
import {dateKey,addDays,zonedInstant,sampleSlotsForDate,monthCells} from '../dist/calendar.mjs';

test('Miami slots retain their wall time across daylight saving transitions', () => {
  assert.equal(new Date(zonedInstant('2026-10-30','09:00','America/New_York')).toISOString(),'2026-10-30T13:00:00.000Z');
  assert.equal(new Date(zonedInstant('2026-11-02','09:00','America/New_York')).toISOString(),'2026-11-02T14:00:00.000Z');
  assert.equal(new Date(zonedInstant('2027-03-12','09:00','America/New_York')).toISOString(),'2027-03-12T14:00:00.000Z');
  assert.equal(new Date(zonedInstant('2027-03-15','09:00','America/New_York')).toISOString(),'2027-03-15T13:00:00.000Z');
});
test('viewer date filtering includes a next-day appointment in Tokyo', () => {
  const now=Date.parse('2026-10-05T00:00:00Z');
  const slots=sampleSlotsForDate('2026-10-07','Asia/Tokyo',now);
  assert.ok(slots.length>0);
  assert.ok(slots.every(slot=>dateKey(slot,'Asia/Tokyo')==='2026-10-07'));
  assert.ok(slots.some(slot=>dateKey(slot,'America/New_York')==='2026-10-06'));
  assert.equal(new Set(slots).size,slots.length);
});
test('no past or too-soon appointment can be selected', () => {
  const now=Date.parse('2026-10-05T21:00:00Z');
  assert.deepEqual(sampleSlotsForDate('2026-10-04','America/New_York',now),[]);
  assert.deepEqual(sampleSlotsForDate('2026-10-06','America/New_York',now),[]);
  assert.ok(sampleSlotsForDate('2026-10-07','America/New_York',now).every(slot=>slot>=now+86400000));
  assert.deepEqual(sampleSlotsForDate('2027-10-05','America/New_York',now),[]);
});
test('weekends, leap day and Monday-first month grid are handled', () => {
  const now=Date.parse('2026-10-05T00:00:00Z');
  assert.deepEqual(sampleSlotsForDate('2026-10-10','America/New_York',now),[]);
  assert.deepEqual(sampleSlotsForDate('2026-10-11','America/New_York',now),[]);
  assert.equal(addDays('2028-02-28',1),'2028-02-29');
  assert.equal(addDays('2028-02-29',1),'2028-03-01');
  const october=monthCells(2026,9);
  assert.equal(october[3],'2026-10-01');
  assert.equal(october.filter(Boolean).length,31);
});
