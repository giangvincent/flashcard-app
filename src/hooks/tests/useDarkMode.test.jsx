import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '../useDarkMode.js'

describe('useDarkMode', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark-mode')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark-mode')
  })

  it('should start in default (non-dark) mode', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.darkMode).toBe(false)
    expect(result.current.setDarkMode).toBeDefined()
    expect(result.current.toggleDarkMode).toBeDefined()
  })

  it('should toggle dark mode state', () => {
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.toggleDarkMode()
    })
    expect(result.current.darkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true)

    act(() => {
      result.current.toggleDarkMode()
    })
    expect(result.current.darkMode).toBe(false)
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false)
  })

  it('should handle setDarkMode callback', () => {
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.setDarkMode(true)
    })
    expect(result.current.darkMode).toBe(true)
    
    act(() => {
      result.current.setDarkMode(false)
    })
    expect(result.current.darkMode).toBe(false)
  })
})