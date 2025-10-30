import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('multibyte exports beyond the file limit fail without altering the ledger', () => {
  const rows = Array.from({ length: 5000 }, (_, index) => entry({ id: 'row-' + index, note: '记'.repeat(300) }));
  const first = { ...rows[0] };
  assert.throws(() => core.exportBackup(rows), /UTF-8/);
  assert.equal(rows.length, 5000);
  assert.deepEqual(rows[0], first);
});

test('successful multibyte exports fit the file limit and preserve all fields', () => {
  const rows = Array.from({ length: 1000 }, (_, index) => entry({ id: 'row-' + index, note: '记'.repeat(300) }));
  const text = core.exportBackup(rows, 123456);
  assert.ok(new TextEncoder().encode(text).byteLength <= core.MAX_BACKUP_BYTES);
  assert.deepEqual(core.importBackup(text), { entries: core.sortEntries(rows), budgetCents: 123456 });
});

test('the UTF-8 byte limit is inclusive and measured before parsing', () => {
  const base = JSON.stringify({ app: 'pocket-ledger', version: 1, entries: [], budgetCents: 0, ignored: '记' });
  const bytes = new TextEncoder().encode(base).byteLength;
  const exact = base + ' '.repeat(core.MAX_BACKUP_BYTES - bytes);
  assert.equal(new TextEncoder().encode(exact).byteLength, core.MAX_BACKUP_BYTES);
  assert.deepEqual(core.importBackup(exact), { entries: [], budgetCents: 0 });
  assert.throws(() => core.importBackup(exact + ' '), /UTF-8/);
});
