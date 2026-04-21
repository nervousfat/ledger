import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('formatMoney renders grouped yuan with two decimals', () => {
  assert.equal(core.formatMoney(1250), '¥12.50');
  assert.equal(core.formatMoney(0), '¥0.00');
  assert.equal(core.formatMoney(123456789), '¥1,234,567.89');
});
test('formatMoney marks refunds negative and rejects fractions', () => {
  assert.equal(core.formatMoney(-50050), '-¥500.50');
  assert.throws(() => core.formatMoney(12.5), /金额必须是整数分/);
});
