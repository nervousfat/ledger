import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('sampleEntries stays inside the requested month', () => {
  const entries = core.sampleEntries('2026-08');
  assert.equal(entries.length, 6);
  for (const item of entries) {
    assert.ok(item.date.startsWith('2026-08'));
    assert.ok(core.TYPES.includes(item.type));
  }
  assert.equal(entries.filter(item => item.type === 'income').length, 2);
});
