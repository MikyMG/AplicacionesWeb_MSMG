import { safeGetItem, safeParseItem, safeSetItem, safeRemoveItem } from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    // mock localStorage
    const store = {};
    global.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    };
  });

  test('safeSetItem and safeGetItem work', () => {
    expect(safeGetItem('missing')).toBeNull();
    expect(safeSetItem('k', { a: 1 })).toBe(true);
    const raw = safeGetItem('k');
    expect(raw).toBe(JSON.stringify({ a: 1 }));
  });

  test('safeParseItem returns fallback on missing or invalid JSON', () => {
    expect(safeParseItem('missing', [])).toEqual([]);
    // set invalid JSON
    global.localStorage.setItem('bad', '{ not json');
    expect(safeParseItem('bad', {})).toEqual({});
  });

  test('safeRemoveItem removes key', () => {
    safeSetItem('t', 123);
    expect(safeGetItem('t')).not.toBeNull();
    expect(safeRemoveItem('t')).toBe(true);
    expect(safeGetItem('t')).toBeNull();
  });
});