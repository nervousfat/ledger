import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('recoverStore starts empty for missing storage', () => {
  assert.deepEqual(core.recoverStore(''), { entries: [], budgetCents: 0, error: '' });
  assert.deepEqual(core.recoverStore(null), { entries: [], budgetCents: 0, error: '' });
});
