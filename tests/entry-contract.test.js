import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('field limits accept exact lengths and reject the next character', () => {
  const value = core.normalizeEntry(entry({ id: 'i'.repeat(80), category: '类'.repeat(40), note: '注'.repeat(300), extra: 'discard' }));
  assert.equal(value.id.length, 80);
  assert.equal(value.category.length, 40);
  assert.equal(value.note.length, 300);
  assert.equal(Object.hasOwn(value, 'extra'), false);
  for (const change of [{ id: 'i'.repeat(81) }, { category: '类'.repeat(41) }, { note: '注'.repeat(301) }]) assert.throws(() => core.normalizeEntry(entry(change)));
});

test('normalization handles missing optional fields while preserving caller data', () => {
  const source = Object.freeze(entry({ id: '  custom_1  ', note: undefined }));
  const normalized = core.normalizeEntry(source);
  assert.equal(normalized.id, 'custom_1');
  assert.equal(normalized.note, '');
  assert.equal(source.id, '  custom_1  ');
  for (const value of [null, [], false, 'entry']) assert.throws(() => core.normalizeEntry(value));
  for (const change of [{ category: null }, { cents: -1 }, { cents: 1.1 }, { note: 'bad\u0001text' }]) assert.throws(() => core.normalizeEntry(entry(change)));
});
