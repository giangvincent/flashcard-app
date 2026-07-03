// src/helpers/helper.js

/**
 * Returns a string representation of today's date in the format YYYY-MM-DD.
 * Uses UTC to avoid timezone‑related inconsistencies in tests.
 *
 * @returns {string}
 */
export function todayKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Loads a JSON value from localStorage.
 * If the key does not exist or the stored value cannot be parsed,
 * the supplied default value is returned.
 *
 * @param {string} key - The storage key.
 * @param {*} defaultValue - Value to return when loading fails.
 * @returns {*}
 */
export function loadState(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (_) {
    // malformed JSON or other errors – fall back to default
    return defaultValue;
  }
}

/**
 * Generates a deterministic numeric hash from a string and a seed.
 * The implementation mirrors a simple 32‑bit FNV‑1a style hash,
 * guaranteeing the same result for identical inputs.
 *
 * @param {string} str - Input string.
 * @param {string} seed - Seed string to vary the hash.
 * @returns {number} Unsigned 32‑bit integer hash.
 */
export function seededHash(str, seed) {
  const combined = `${seed}:${str}`;
  let hash = 0x811c9dc5; // FNV offset basis
  const fnvPrime = 0x01000193;

  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    // Multiply by FNV prime (mod 2^32)
    hash = (hash * fnvPrime) >>> 0;
  }
  // Ensure a positive integer (0‑4294967295)
  return hash >>> 0;
}

/**
 * Returns a new array containing the elements of `array` shuffled deterministically
 * for the current day. The algorithm uses `todayKey()` as the base seed and a
 * Fisher‑Yates shuffle driven by `seededHash`.
 *
 * @template T
 * @param {T[]} array - The array to shuffle.
 * @returns {T[]} A new shuffled array (original array is untouched).
 */
export function shuffleForToday(array) {
  // Guard against empty or non‑array inputs
  if (!Array.isArray(array) || array.length === 0) return [];

  const result = array.slice(); // shallow copy
  const baseSeed = todayKey();

  // Fisher‑Yates shuffle with deterministic pseudo‑random numbers
  for (let i = result.length - 1; i > 0; i--) {
    // Create a deterministic “random” number for this position
    const hash = seededHash(String(i), baseSeed);
    const j = hash % (i + 1); // index to swap with
    // Swap result[i] and result[j]
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}