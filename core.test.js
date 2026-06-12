import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from './core.js';

const entry = (changes = {}) => ({ id: 'entry-one', type: 'expense', cents: 1234, category: '餐饮', date: '2026-09-10', note: '', ...changes });

test('金额以整数分解析，避免浮点小数误差', () => {
  assert.equal(core.parseMoney('0.29'), 29);
  assert.equal(core.parseMoney('10.1'), 1010);
  assert.equal(core.parseMoney('0'), 0);
  assert.equal(core.parseMoney(' 12.34 '), 1234);
  assert.equal(core.parseMoney('1000000000'), core.MAX_CENTS);
  assert.equal(core.parseMoney('0.10') + core.parseMoney('0.20'), 30);
  assert.equal(core.formatMoney(-1234), '-¥12.34');
});

test('金额拒绝不明确格式和超范围数值', () => {
  const invalid = ['1.005', '-1', '1e3', '', '01', '1,000', 'Infinity', 'NaN', '1000000000.01'];
  for (const value of invalid) assert.throws(() => core.parseMoney(value));
  assert.throws(() => core.parseMoney(NaN));
  assert.throws(() => core.parseMoney(Infinity));
  assert.throws(() => core.parseMoney({}));
  assert.throws(() => core.formatMoney(1.5));
  assert.throws(() => core.normalizeEntry(entry({ cents: 0 })));
});

test('真实日历日期验证支持闰年', () => {
  assert.equal(core.validateDate('2024-02-29'), '2024-02-29');
  assert.equal(core.validateDate('2100-12-31'), '2100-12-31');
  assert.throws(() => core.validateDate('2025-02-29'));
  assert.throws(() => core.validateDate('2026-04-31'));
  assert.throws(() => core.validateDate('2026-13-01'));
  assert.throws(() => core.validateDate('2026-9-01'));
  assert.throws(() => core.validateDate('1899-12-31'));
});

test('账目规范化限制文本与关键字段', () => {
  const value = core.normalizeEntry(entry({ category: ' 餐饮 ', note: ' 午餐 ' }));
  assert.equal(value.category, '餐饮');
  assert.equal(value.note, '午餐');
  assert.throws(() => core.normalizeEntry(entry({ type: 'other' })));
  assert.throws(() => core.normalizeEntry(entry({ category: '' })));
  assert.throws(() => core.normalizeEntry(entry({ note: 'x'.repeat(301) })));
  assert.throws(() => core.normalizeEntry(entry({ cents: Infinity })));
  assert.throws(() => core.normalizeEntry(entry({ id: '<bad>' })));
});

test('新增账目保持不可变性并拒绝重复标识', () => {
  const original = [entry()];
  const added = core.addEntry(original, entry({ id: 'entry-two', date: '2026-09-11' }));
  assert.equal(original.length, 1);
  assert.equal(added.length, 2);
  assert.equal(added[0].id, 'entry-two');
  assert.notEqual(added[1], original[0]);
  assert.throws(() => core.addEntry(original, entry()));
  assert.match(core.createId(), /^[a-zA-Z0-9_-]+$/);
});

test('编辑删除保留身份且错误不会改变原账目', () => {
  const original = [entry()];
  const updated = core.updateEntry(original, 'entry-one', { id: 'ignored', cents: 500 });
  assert.equal(updated[0].id, 'entry-one');
  assert.equal(updated[0].cents, 500);
  assert.equal(original[0].cents, 1234);
  assert.deepEqual(core.removeEntry(updated, 'entry-one'), []);
  assert.throws(() => core.removeEntry(original, 'missing'));
  assert.throws(() => core.updateEntry(original, 'missing', { cents: 20 }));
});

test('月份类型关键词筛选可以组合', () => {
  const rows = [entry({ note: 'Coffee' }), entry({ id: 'two', date: '2026-08-10' }), entry({ id: 'three', type: 'income' })];
  assert.equal(core.filterEntries(rows, { month: '2026-09' }).length, 2);
  assert.equal(core.filterEntries(rows, { type: 'income' }).length, 1);
  assert.equal(core.filterEntries(rows, { month: '2026-09', query: 'coffee', type: 'expense' }).length, 1);
  assert.equal(core.filterEntries(rows, { query: '不存在' }).length, 0);
  assert.throws(() => core.filterEntries(rows, { month: '2026-13' }));
  assert.throws(() => core.filterEntries(rows, { type: 'invalid' }));
});

test('收支汇总精确且空集合有零值', () => {
  const rows = [entry({ cents: 10 }), entry({ id: 'two', cents: 20 }), entry({ id: 'three', type: 'income', cents: 100 })];
  const totals = core.summarize(rows);
  assert.equal(totals.expense, 30);
  assert.equal(totals.income, 100);
  assert.equal(totals.balance, 70);
  assert.equal(totals.count, 3);
  assert.deepEqual(core.summarize([]), { income: 0, expense: 0, balance: 0, count: 0 });
});

test('分类汇总与月度分组保持稳定次序', () => {
  const rows = [entry({ cents: 100 }), entry({ id: 'two', category: '交通', cents: 300 }), entry({ id: 'three', type: 'income', date: '2026-08-10' })];
  const categories = core.summarizeCategories(rows);
  assert.equal(categories[0].category, '交通');
  assert.equal(categories[0].share, 0.75);
  assert.equal(categories[1].cents, 100);
  assert.equal(core.groupByMonth(rows)[0].month, '2026-09');
  assert.equal(core.groupByMonth(rows)[1].income, 1234);
  assert.deepEqual(core.summarizeCategories([]), []);
});

test('CSV引用逗号换行并使公式文本失活', () => {
  const csv = core.exportCsv([entry({ category: '=SUM(A1)', note: 'hello,"world"\nline' })]);
  assert.ok(csv.startsWith('\ufeff'));
  assert.ok(csv.includes('"\'=SUM(A1)"'));
  assert.ok(csv.includes('"hello,""world""\nline"'));
  assert.ok(csv.includes('"12.34"'));
  const dangerous = core.exportCsv([entry({ note: '@SUM(1)' })]);
  assert.ok(dangerous.includes('"\'@SUM(1)"'));
});

test('JSON备份往返保留金额预算与Unicode文本', () => {
  const rows = [entry({ note: '咖啡 ☕' })];
  const backup = core.exportBackup(rows, 50000);
  const restored = core.importBackup(backup);
  assert.deepEqual(restored.entries, rows);
  assert.equal(restored.budgetCents, 50000);
  assert.equal(JSON.parse(backup).version, 1);
  assert.equal(JSON.parse(backup).app, 'pocket-ledger');
  assert.notEqual(restored.entries, rows);
});

test('导入拒绝损坏格式重复身份与非法金额', () => {
  const backup = JSON.parse(core.exportBackup([entry()], 100));
  assert.throws(() => core.importBackup('not json'));
  assert.throws(() => core.importBackup(JSON.stringify({ ...backup, version: 2 })));
  assert.throws(() => core.importBackup(JSON.stringify({ ...backup, entries: [entry(), entry()] })));
  assert.throws(() => core.importBackup(JSON.stringify({ ...backup, entries: [entry({ id: undefined })] })));
  assert.throws(() => core.importBackup(JSON.stringify({ ...backup, entries: [entry({ cents: 1.5 })] })));
  assert.throws(() => core.importBackup(JSON.stringify({ ...backup, budgetCents: -1 })));
  assert.throws(() => core.importBackup('x'.repeat(5_000_001)));
});

