import { afterEach, vi, describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  store: {}
}
localStorageMock.getItem = vi.fn((key) => localStorageMock.store[key] || null)
localStorageMock.setItem = vi.fn((key, value) => { localStorageMock.store[key] = String(value) })
localStorageMock.removeItem = vi.fn((key) => { delete localStorageMock.store[key] })
localStorageMock.clear = vi.fn(() => { localStorageMock.store = {} })

global.localStorage = localStorageMock

// Mock window.matchMedia
Object.assign(window, {
  matchMedia: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

// Mock window.DeviceOrientationEvent
Object.assign(window, {
  DeviceOrientationEvent: class {}
})

// Mock window.requestIdleCallback
Object.assign(window, {
  requestIdleCallback: (cb) => setTimeout(cb, 0),
  cancelIdleCallback: (id) => clearTimeout(id)
})

// Mock window.fetch
const fetchMock = vi.fn()
const responseMock = vi.fn()

responseMock.mockImplementation(() => {
  return Promise.resolve({
    json: vi.fn().mockReturnValue(Promise.resolve({})),
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 'basic',
    headers: {
      get: vi.fn(() => null),
      has: vi.fn(() => false),
      set: vi.fn(),
      append: vi.fn(),
      getSetCookie: vi.fn(() => []),
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn().mockReturnValue(Promise.resolve(new ArrayBuffer())),
    blob: vi.fn().mockReturnValue(Promise.resolve(new Blob())),
    formData: vi.fn().mockReturnValue(Promise.resolve(new FormData())),
    text: vi.fn().mockReturnValue(Promise.resolve('')),
  })
})

fetchMock.mockImplementation((url, opts) => {
  if (opts && opts.body) {
    responseMock(opts.body)
  } else {
    responseMock()
  }
  return responseMock
})

global.fetch = fetchMock

// Setup React Testing Library
const react = require('@testing-library/react')
global.renderHook = react.renderHook
global.act = react.act
global.describe = vi.describe
global.it = vi.it
global.expect = vi.expect
global.beforeEach = vi.beforeEach
global.afterEach = vi.afterEach
global.vi = vi

// Mock window.confirm for testing resetProgress
window.confirm = vi.fn().mockReturnValue(false)

// Cleanup after each test
afterEach(() => {
  localStorage.clear()
  fetchMock.mockClear()
  responseMock.mockClear()
  window.confirm.mockClear()
})