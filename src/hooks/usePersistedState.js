import { useEffect, useState } from 'react'
import { STORAGE_KEY, defaultState } from '../constants/appConstants.js'
import { loadState as loadStateHelper } from '../helpers/helper.js'

function loadAppState() {
  const saved = loadStateHelper(STORAGE_KEY, null)
  if (saved === null) {
    return structuredClone(defaultState)
  }

  return {
    ...defaultState,
    ...saved,
    quotas: { ...defaultState.quotas, ...saved?.quotas },
  }
}

export function usePersistedState() {
  const [state, setState] = useState(loadAppState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return [state, setState]
}
