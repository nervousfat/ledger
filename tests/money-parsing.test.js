import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('parseMoney accepts plain and two-decimal amounts', () => {
  assert.equal(core.parseMoney('0'), 0);
  assert.equal(core.parseMoney(12), 1200);
  assert.equal(core.parseMoney('12.5'), 1250);
  assert.equal(core.parseMoney('12.50'), 1250);
});

test('parseMoney rejects malformed amounts', () => {
  assert.throws(() => core.parseMoney('0012'), /金额最多保留两位小数/);
  assert.throws(() => core.parseMoney('12.999'), /金额最多保留两位小数/);
  assert.throws(() => core.parseMoney('-5'), /金额最多保留两位小数/);
  assert.throws(() => core.parseMoney('1,234'), /金额最多保留两位小数/);
});
