import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const entry = (fields = {}) => ({ id: 'e1', type: 'expense', cents: 100, category: '餐饮', note: '', date: '2026-04-01', ...fields });

test('summarizeCategories ranks spend and splits shares', () => {
  const entries = [
    entry({ id: 'a', cents: 3000, category: '餐饮' }),
    entry({ id: 'b', cents: 2000, category: '交通' }),
    entry({ id: 'c', cents: 1000, category: '餐饮' }),
    entry({ id: 'd', type: 'income', cents: 99999, category: '工资' })
  ];
  const ranked = core.summarizeCategories(entries);
  assert.deepEqual(ranked.map(item => item.category), ['餐饮', '交通']);
  assert.deepEqual(ranked.map(item => item.cents), [4000, 2000]);
  assert.ok(Math.abs(ranked[0].share - 2 / 3) < 1e-9);
  assert.ok(Math.abs(ranked.reduce((sum, item) => sum + item.share, 0) - 1) < 1e-9);
});
