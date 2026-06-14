import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-06-01', ...fields });

test('exportCsv emits BOM, CRLF rows and quoted cells', () => {
  const csv = core.exportCsv([entry({ id: 'a', note: '含"引号"的备注' })]);
  assert.ok(csv.startsWith('\ufeff'));
  assert.ok(csv.includes('\r\n'));
  assert.ok(csv.includes('"含""引号""的备注"'));
  assert.equal(csv.split('\r\n').length, 2);
});
