import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('combined filtering equals intersection of independent predicates', () => {
  const rows = [entry({ id: 'a', note: 'Train pass', category: '交通' }), entry({ id: 'b', type: 'income', note: 'Train refund' }), entry({ id: 'c', date: '2025-11-30', note: 'Train pass' }), entry({ id: 'd', note: 'Lunch' })];
  const before = structuredClone(rows);
  const month = core.filterEntries(rows, { month: '2025-12' });
  const expected = core.filterEntries(core.filterEntries(month, { type: 'expense' }), { query: 'train' });
  assert.deepEqual(core.filterEntries(rows, { month: '2025-12', type: 'expense', query: '  TRAIN  ' }), expected);
  assert.deepEqual(expected.map(value => value.id), ['a']);
  assert.deepEqual(rows, before);
  assert.equal(core.filterEntries(rows, { query: '  ' }).length, rows.length);
  assert.deepEqual(core.filterEntries(rows, { query: '交通' }).map(value => value.id), ['a']);
});
