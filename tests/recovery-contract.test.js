import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('missing values produce independent empty recovery results', () => {
  for (const value of [null, undefined, '']) assert.deepEqual(core.recoverStore(value), { entries: [], budgetCents: 0, error: '' });
  const first = core.recoverStore(null);
  first.entries.push(entry());
  assert.deepEqual(core.recoverStore(null).entries, []);
});

test('valid empty budgets survive recovery while unsupported data is reported', () => {
  assert.deepEqual(core.recoverStore(core.exportBackup([], 500)), { entries: [], budgetCents: 500, error: '' });
  for (const raw of [' ', 'null', '{}', JSON.stringify({ app: 'other', version: 1, entries: [] })]) {
    const result = core.recoverStore(raw);
    assert.deepEqual(result.entries, []);
    assert.equal(result.budgetCents, 0);
    assert.match(result.error, /原始内容未被覆盖/);
  }
});
