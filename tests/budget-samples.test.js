import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('the budget threshold distinguishes exact use from a one-cent overrun', () => {
  const rows = [entry({ cents: 500 }), entry({ id: 'income', type: 'income', cents: 900 }), entry({ id: 'other', date: '2025-11-30', cents: 800 })];
  const exact = core.budgetStatus(rows, 500, '2025-12');
  assert.deepEqual(exact, { budgetCents: 500, expense: 500, remaining: 0, ratio: 1, exceeded: false, configured: true });
  const exceeded = core.budgetStatus(rows, 499, '2025-12');
  assert.equal(exceeded.remaining, -1);
  assert.equal(exceeded.exceeded, true);
  assert.equal(core.budgetStatus(rows, 0, '2025-12').ratio, 0);
});

test('separate sample batches are independent and remain usable across year ends', () => {
  const first = core.sampleEntries('2025-12');
  const second = core.sampleEntries('2026-01');
  assert.equal(new Set([...first, ...second].map(value => value.id)).size, 12);
  assert.ok(first.every(value => value.date.startsWith('2025-12')));
  assert.ok(second.every(value => value.date.startsWith('2026-01')));
  const before = second[0].note;
  first[0].note = 'edited';
  assert.equal(second[0].note, before);
  assert.throws(() => core.sampleEntries('2025-13'));
  assert.throws(() => core.budgetStatus([], 100, '2025-00'));
});
