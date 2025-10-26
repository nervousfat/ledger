import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('empty exports contain the exact localized five-column header', () => {
  assert.equal(core.exportCsv([]), '\ufeff"日期","类型","分类","金额（元）","备注"');
});

test('CSV preserves commas quotes newlines and tiny income amounts', () => {
  const rows = [entry({ id: 'a', type: 'income', cents: 1, category: '写作,设计', note: '第一行\n第二行 "quoted"' })];
  const before = structuredClone(rows);
  const lines = core.exportCsv(rows);
  assert.equal(lines, '\ufeff"日期","类型","分类","金额（元）","备注"\r\n"2025-12-31","收入","写作,设计","0.01","第一行\n第二行 ""quoted"""');
  assert.deepEqual(rows, before);
});
