import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-09-01', ...fields });

test('sortEntries orders by date descending then identifier', () => {
  const entries = [
    entry({ id: 'b', date: '2026-09-01' }),
    entry({ id: 'a', date: '2026-09-01' }),
    entry({ id: 'c', date: '2026-09-30' })
  ];
  assert.deepEqual(core.sortEntries(entries).map(item => item.id), ['c', 'a', 'b']);
});
test('updateEntry keeps identity while replacing fields', () => {
  const entries = [entry({ id: 'a', cents: 100 })];
  const updated = core.updateEntry(entries, 'a', { cents: 250, note: '加价' });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, 'a');
  assert.equal(updated[0].cents, 250);
  assert.equal(updated[0].note, '加价');
  assert.throws(() => core.updateEntry(entries, 'missing', { cents: 1 }), /账目不存在/);
});
