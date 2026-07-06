/**
 * @file src/helpers/helper.test.js
 * Unit tests for the helper module that exports:
 *   - todayKey()
 *   - loadState(key, defaultValue)
 *   - seededHash(str, seed)
 *   - shuffleForToday(array)
 *
 * The tests focus on expected behaviour, not implementation details.
 */

import {
  addDaysToKey,
  dateToDays,
  daysToDate,
  todayKey,
  loadState,
  seededHash,
  shuffleForToday,
} from './helper';
import { vi, describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { mockLocalStorage } from '../test-utils';

describe('Helper module', () => {
  /* -------------------------------------------------
   * todayKey()
   * ------------------------------------------------- */
  describe('todayKey', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('should return a YYYY‑MM‑DD string for the current date', () => {
      // Set a known date (2022‑03‑15)
      const mockDate = new Date('2022-03-15T12:00:00Z');
      vi.setSystemTime(mockDate);

      const key = todayKey();
      expect(key).toBe('2022-03-15');
    });

    it('should change when the day changes', () => {
      const day1 = new Date('2022-04-01T00:00:00Z');
      const day2 = new Date('2022-04-02T00:00:00Z');

      vi.setSystemTime(day1);
      const key1 = todayKey();

      vi.setSystemTime(day2);
      const key2 = todayKey();

      expect(key1).toBe('2022-04-01');
      expect(key2).toBe('2022-04-02');
      expect(key1).not.toBe(key2);
    });
  });

  /* -------------------------------------------------
   * loadState(key, defaultValue)
   * ------------------------------------------------- */
  describe('loadState', () => {
    const LS_KEY = 'testKey';
    const storedObj = { a: 1, b: 'two' };

    beforeEach(() => {
      // Ensure a clean localStorage before each test
      localStorage.clear();
    });

    it('should return the parsed JSON value when the key exists', () => {
      localStorage.setItem(LS_KEY, JSON.stringify(storedObj));

      const result = loadState(LS_KEY, {});

      expect(result).toEqual(storedObj);
    });

    it('should return the provided default when the key does not exist', () => {
      const defaultVal = { default: true };
      const result = loadState(LS_KEY, defaultVal);

      expect(result).toBe(defaultVal);
    });

    it('should gracefully handle malformed JSON and fall back to default', () => {
      localStorage.setItem(LS_KEY, '{invalidJson:');

      const defaultVal = { fallback: true };
      const result = loadState(LS_KEY, defaultVal);

      expect(result).toBe(defaultVal);
    });
  });

  /* -------------------------------------------------
   * seededHash(str, seed)
   * ------------------------------------------------- */
  describe('seededHash', () => {
    const input = 'some deterministic string';

    it('should produce the same hash for identical inputs and seed', () => {
      const seed = 'seed-123';
      const hash1 = seededHash(input, seed);
      const hash2 = seededHash(input, seed);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different seeds', () => {
      const hashA = seededHash(input, 'seed-A');
      const hashB = seededHash(input, 'seed-B');
      expect(hashA).not.toBe(hashB);
    });

    it('should produce a number (or numeric string) as hash output', () => {
      const hash = seededHash(input, 'seed');
      // Accept both number and numeric string representations
      expect(typeof hash === 'number' || /^\d+$/.test(hash)).toBe(true);
    });
  });

  /* -------------------------------------------------
   * date helpers
   * ------------------------------------------------- */
  describe('date helpers', () => {
    it('dateToDays should convert a day key to a day number', () => {
      expect(dateToDays('1970-01-02')).toBe(1);
    });

    it('daysToDate should convert a day number back to a day key', () => {
      expect(daysToDate(1)).toBe('1970-01-02');
    });

    it('addDaysToKey should add an offset to a day key', () => {
      expect(addDaysToKey('2022-03-15', 3)).toBe('2022-03-18');
    });
  });

  /* -------------------------------------------------
   * shuffleForToday(array)
   * ------------------------------------------------- */
  describe('shuffleForToday', () => {
    const originalArray = [1, 2, 3, 4, 5, 6];

    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('should return a new array (not mutate the original)', () => {
      const shuffled = shuffleForToday(originalArray);
      expect(shuffled).toEqual(expect.arrayContaining(originalArray));
      expect(shuffled).not.toBe(originalArray); // reference inequality
      // Ensure original order is unchanged
      expect(originalArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should produce deterministic ordering for a given day', () => {
      const mockDate = new Date('2022-07-20T08:00:00Z');
      vi.setSystemTime(mockDate);

      const firstCall = shuffleForToday(originalArray);
      const secondCall = shuffleForToday(originalArray);
      expect(firstCall).toEqual(secondCall);
    });

    it('should produce a different ordering on a different day', () => {
      const dayOne = new Date('2022-07-20T08:00:00Z');
      const dayTwo = new Date('2022-07-21T08:00:00Z');

      vi.setSystemTime(dayOne);
      const resultDayOne = shuffleForToday(originalArray);

      vi.setSystemTime(dayTwo);
      const resultDayTwo = shuffleForToday(originalArray);

      // Very unlikely to be identical; if they are, the test will still pass as long as they are not the same reference
      expect(resultDayOne).not.toEqual(resultDayTwo);
    });

    it('should handle empty arrays gracefully', () => {
      const result = shuffleForToday([]);
      expect(result).toEqual([]);
    });
  });
});