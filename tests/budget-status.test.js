import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-05-02', ...fields });

test('budgetStatus flags overruns with exact ratios', () => {
  const entries = [entry({ id: 'a', cents: 30000 }), entry({ id: 'b', cents: 20000, date: '2026-04-15' })];
  const status = core.budgetStatus(entries, 40000, '2026-05');
  assert.equal(status.expense, 30000);
  assert.equal(status.remaining, 10000);
  assert.equal(status.ratio, 0.75);
  assert.equal(status.exceeded, false);
  const over = core.budgetStatus(entries, 25000, '2026-05');
  assert.equal(over.exceeded, true);
  assert.equal(over.remaining, -5000);
});
