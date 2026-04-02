import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const AppConfigContext = createContext(null)

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.getConfig().then(setConfig).catch((e) => console.error('Failed to load app config:', e))
  }, [])

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(AppConfigContext)
}
