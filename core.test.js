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

