import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('partitioned summaries reconcile with aggregate income and expense', () => {
  const rows = Array.from({ length: 60 }, (_, index) => entry({ id: 'row-' + index, type: index % 3 ? 'expense' : 'income', cents: (index + 1) * 37, category: ['A', 'B', 'C'][index % 3], date: index % 2 ? '2025-12-31' : '2026-01-01' }));
  const total = core.summarize(rows);
  const months = core.groupByMonth(rows);
  for (const key of ['income', 'expense', 'balance', 'count']) assert.equal(months.reduce((sum, month) => sum + month[key], 0), total[key], key);
  for (const type of ['income', 'expense']) {
    const categories = core.summarizeCategories(rows, type);
    assert.equal(categories.reduce((sum, item) => sum + item.cents, 0), total[type]);
    assert.ok(Math.abs(categories.reduce((sum, item) => sum + item.share, 0) - 1) < 1e-12);
  }
  assert.deepEqual(months.map(value => value.month), ['2026-01', '2025-12']);
});

test('large legal transactions retain exact integer totals and empty partitions', () => {
  const rows = [entry({ cents: core.MAX_CENTS }), entry({ id: 'income', type: 'income', cents: core.MAX_CENTS })];
  assert.deepEqual(core.summarize(rows), { income: core.MAX_CENTS, expense: core.MAX_CENTS, balance: 0, count: 2 });
  assert.deepEqual(core.summarizeCategories(rows.filter(value => value.type === 'income')), []);
  assert.deepEqual(core.groupByMonth([]), []);
});
