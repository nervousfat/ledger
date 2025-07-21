import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('decimal conversion is exact around cent, yuan and maximum boundaries', () => {
  const cents = [0, 1, 9, 10, 29, 99, 100, 101, 9999, core.MAX_CENTS - 1, core.MAX_CENTS];
  for (const value of cents) {
    const decimal = Math.floor(value / 100) + '.' + String(value % 100).padStart(2, '0');
    assert.equal(core.parseMoney(decimal), value, decimal);
    assert.equal(core.parseMoney(Number(decimal)), value, decimal);
    assert.match(core.formatMoney(value), /\.\d{2}$/);
  }
  assert.equal(core.formatMoney(0), '¥0.00');
  assert.equal(core.formatMoney(-1), '-¥0.01');
  assert.equal(core.formatMoney(100000), '¥1,000.00');
});

test('non-decimal numeric forms never silently round', () => {
  for (const value of [0.001, 1e-7, Number.MAX_SAFE_INTEGER, null, true, [], new Number(2)]) {
    assert.throws(() => core.parseMoney(value));
  }
  for (const value of [NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => core.formatMoney(value));
});
