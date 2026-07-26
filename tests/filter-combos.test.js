import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-07-01', ...fields });

test('filterEntries combines month type and query', () => {
  const entries = [
    entry({ id: 'a', category: '餐饮', note: '午餐' }),
    entry({ id: 'b', category: '交通', note: '地铁' }),
    entry({ id: 'c', type: 'income', category: '工资', note: '七月薪资' }),
    entry({ id: 'd', date: '2026-06-18', note: '六月午餐' })
  ];
  assert.deepEqual(core.filterEntries(entries, { month: '2026-07' }).map(item => item.id), ['a', 'b', 'c']);
  assert.deepEqual(core.filterEntries(entries, { month: '2026-07', type: 'expense' }).map(item => item.id), ['a', 'b']);
  assert.deepEqual(core.filterEntries(entries, { query: '午餐' }).map(item => item.id), ['a', 'd']);
});
