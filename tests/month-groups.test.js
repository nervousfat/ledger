import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-05-01', ...fields });

test('groupByMonth returns recent months first with totals', () => {
  const entries = [
    entry({ id: 'a', date: '2026-03-05', cents: 1200 }),
    entry({ id: 'b', date: '2026-05-02', cents: 800 }),
    entry({ id: 'c', date: '2026-05-03', cents: 200 })
  ];
  const groups = core.groupByMonth(entries);
  assert.deepEqual(groups.map(group => group.month), ['2026-05', '2026-03']);
  assert.equal(groups[0].expense, 1000);
  assert.equal(groups[0].count, 2);
});
