import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('dates descend and same-day identifiers have deterministic order', () => {
  const values = [entry({ id: 'z' }), entry({ id: 'old', date: '2024-12-31' }), entry({ id: 'a' }), entry({ id: 'new', date: '2026-01-01' })];
  const frozen = Object.freeze(values.map(Object.freeze));
  const sorted = core.sortEntries(frozen);
  assert.deepEqual(sorted.map(value => value.id), ['new', 'a', 'z', 'old']);
  assert.deepEqual(frozen.map(value => value.id), ['z', 'old', 'a', 'new']);
  sorted[1].note = 'changed';
  assert.equal(frozen[2].note, '');
  assert.deepEqual(core.sortEntries(sorted).map(value => value.id), sorted.map(value => value.id));
});

test('invalid collections fail before publishing a partial sorted result', () => {
  for (const value of [null, {}, 'entries']) assert.throws(() => core.sortEntries(value));
  const rows = [entry(), entry({ id: 'bad', date: '2025-02-30' })];
  const before = structuredClone(rows);
  assert.throws(() => core.sortEntries(rows));
  assert.deepEqual(rows, before);
});
