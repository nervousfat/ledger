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

