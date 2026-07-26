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
test('importBackup rejects foreign payloads and invalid budgets', () => {
  const entries = () => [entry({ id: 'a' })];
  assert.throws(() => core.importBackup('{"app":"other","version":1}'), /备份来源或版本不受支持/);
  assert.throws(() => core.importBackup('oops'), /无法读取 JSON 备份/);
  assert.throws(() => core.exportBackup(entries(), 5.5), /预算无效/);
});
