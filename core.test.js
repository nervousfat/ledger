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

