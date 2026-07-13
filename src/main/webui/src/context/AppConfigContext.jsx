import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { AppConfigContext } from './AppConfigContextValue'

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
