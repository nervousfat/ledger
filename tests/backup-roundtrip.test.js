import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-07-01', ...fields });

test('exportBackup and importBackup preserve entries and budgets', () => {
  const entries = [entry({ id: 'a', cents: 250 }), entry({ id: 'b', type: 'income', cents: 90000, category: '工资' })];
  const restored = core.importBackup(core.exportBackup(entries, 50000));
  assert.deepEqual(restored.entries, core.sortEntries(entries));
  assert.equal(restored.budgetCents, 50000);
});
