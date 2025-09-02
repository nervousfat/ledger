import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('the ten-thousandth entry fits and the next insertion is atomic', () => {
  const rows = Array.from({ length: 9999 }, (_, index) => entry({ id: 'item-' + index }));
  const full = core.addEntry(rows, entry({ id: 'last' }));
  assert.equal(full.length, 10000);
  assert.equal(rows.length, 9999);
  const before = structuredClone(full);
  assert.throws(() => core.addEntry(full, entry({ id: 'overflow' })), /10000/);
  assert.deepEqual(full, before);
});

test('canonical identity collisions are rejected without appending a row', () => {
  const rows = [entry({ id: 'same' })];
  assert.throws(() => core.addEntry(rows, entry({ id: ' same ' })), /重复/);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'same');
});
