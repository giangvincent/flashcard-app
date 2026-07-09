import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { addDaysToKey, loadState, shuffleForToday, todayKey } from './helpers/helper.js'

vi.mock('./helpers/helper.js', () => ({
  addDaysToKey: vi.fn((dayKey, offset) => {
    const base = new Date(dayKey)
    base.setDate(base.getDate() + offset)
    return base.toISOString().slice(0, 10)
  }),
  todayKey: vi.fn(),
  loadState: vi.fn(),
  shuffleForToday: vi.fn((cards) => cards),
}))

describe('App helper integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    todayKey.mockReturnValue('2026-07-03')
    loadState.mockReturnValue(null)
    addDaysToKey.mockImplementation((dayKey, offset) => {
      const base = new Date(dayKey)
      base.setDate(base.getDate() + offset)
      return base.toISOString().slice(0, 10)
    })
    shuffleForToday.mockImplementation((cards) => cards)
  })

  it('loads saved study state through helper.js and renders the current day', () => {
    const html = renderToString(<App />)

    expect(loadState).toHaveBeenCalledWith('german-srs-state-v2', null)
    expect(todayKey).toHaveBeenCalled()
    expect(shuffleForToday).toHaveBeenCalled()
    expect(html).toContain('2026-07-03')
    expect(html).toContain('Spaced repetition from your books')
  })

  it('counts streak days from the current helper date instead of reusing today for every offset', () => {
    loadState.mockReturnValue({
      history: {
        '2026-07-03': { reviews: 4 },
      },
    })

    const html = renderToString(<App />)

    expect(html).toContain('1d')
    expect(html).not.toContain('365')
  })
})