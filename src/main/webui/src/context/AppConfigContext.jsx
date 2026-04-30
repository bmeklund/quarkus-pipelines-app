import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const AppConfigContext = createContext(null)

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState(null)

  useEffect(() => {
    api.getConfig()
      .then(setConfig)
      .catch((e) => {
        console.error('Failed to load app config:', e)
        setConfigError(e.message)
      })
  }, [])

  return (
    <AppConfigContext.Provider value={{ data: config, error: configError }}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(AppConfigContext)?.data ?? null
}

export function useAppConfigError() {
  return useContext(AppConfigContext)?.error ?? null
}
