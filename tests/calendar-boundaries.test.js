import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { entry } from './fixtures.js';

test('Gregorian century rules distinguish 1900, 2000 and 2100', () => {
  assert.equal(core.validateDate('2000-02-29'), '2000-02-29');
  for (const value of ['1900-02-29', '2100-02-29', '2000-02-30', '2025-00-01', '2025-01-00']) assert.throws(() => core.validateDate(value));
});

test('inclusive year endpoints do not admit adjacent years or timestamp strings', () => {
  for (const value of ['1900-01-01', '2100-12-31', '2025-04-30', '2025-12-31']) assert.equal(core.validateDate(value), value);
  for (const value of ['1899-12-31', '2101-01-01', '2025-01-01T00:00:00Z', ' 2025-01-01', null, 20250101]) assert.throws(() => core.validateDate(value));
});
