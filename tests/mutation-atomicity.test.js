import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('a failed edit cannot partially apply a valid field from the same patch', () => {
  const rows = Object.freeze([Object.freeze(entry()), Object.freeze(entry({ id: 'b', date: '2025-12-30' }))]);
  const before = structuredClone(rows);
  assert.throws(() => core.updateEntry(rows, 'entry-a', { note: 'would change', cents: -5 }));
  assert.throws(() => core.updateEntry(rows, 'entry-a', null));
  assert.throws(() => core.removeEntry(rows, ''));
  assert.deepEqual(rows, before);
});

test('moving an entry across a year boundary preserves all unrelated records', () => {
  const rows = [entry(), entry({ id: 'b', date: '2025-12-30', note: 'keep' })];
  const result = core.updateEntry(rows, 'b', { date: '2026-01-01', type: 'income' });
  assert.deepEqual(result.map(value => value.id), ['b', 'entry-a']);
  assert.equal(result[0].note, 'keep');
  assert.equal(rows[1].date, '2025-12-30');
  const removed = core.removeEntry(result, 'entry-a');
  assert.deepEqual(removed, [result[0]]);
});
