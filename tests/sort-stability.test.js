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
