import test from 'node:test';
import assert from 'node:assert';
import { normalizeDemand } from './demand.js';

test('normalizeDemand tests', async (t) => {
  await t.test('should return 5 for jobCount > 2000', () => {
    assert.strictEqual(normalizeDemand(2001), 5);
    assert.strictEqual(normalizeDemand(10000), 5);
  });

  await t.test('should return 4 for 1000 <= jobCount <= 2000', () => {
    assert.strictEqual(normalizeDemand(2000), 4);
    assert.strictEqual(normalizeDemand(1500), 4);
    assert.strictEqual(normalizeDemand(1000), 4);
  });

  await t.test('should return 3 for 500 <= jobCount < 1000', () => {
    assert.strictEqual(normalizeDemand(999), 3);
    assert.strictEqual(normalizeDemand(750), 3);
    assert.strictEqual(normalizeDemand(500), 3);
  });

  await t.test('should return 2 for 150 <= jobCount < 500', () => {
    assert.strictEqual(normalizeDemand(499), 2);
    assert.strictEqual(normalizeDemand(300), 2);
    assert.strictEqual(normalizeDemand(150), 2);
  });

  await t.test('should return 1 for jobCount < 150', () => {
    assert.strictEqual(normalizeDemand(149), 1);
    assert.strictEqual(normalizeDemand(50), 1);
    assert.strictEqual(normalizeDemand(0), 1);
    assert.strictEqual(normalizeDemand(-10), 1);
  });
});
