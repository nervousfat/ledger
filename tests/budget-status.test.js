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
test('budgetStatus treats zero budgets as unconfigured', () => {
  const status = core.budgetStatus([], 0, '2026-05');
  assert.equal(status.configured, false);
  assert.equal(status.ratio, 0);
  assert.equal(status.exceeded, false);
  assert.throws(() => core.budgetStatus([], 1000, '2026-5'), /请选择预算月份/);
  assert.throws(() => core.budgetStatus([], -1, '2026-05'), /预算无效/);
});
