// Mock localStorage for testing
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

// Setup localStorage mock before tests run
const localStorageMock = new LocalStorageMock();
global.localStorage = localStorageMock;

export const mockLocalStorage = {
  clear: () => localStorageMock.clear(),
  getItem: (key) => localStorageMock.getItem(key),
  setItem: (key, value) => localStorageMock.setItem(key, value),
  removeItem: (key) => localStorageMock.removeItem(key)
};

export default localStorageMock;