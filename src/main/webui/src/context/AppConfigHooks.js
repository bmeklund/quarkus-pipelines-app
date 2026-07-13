import { useContext } from 'react'
import { AppConfigContext } from './AppConfigContextValue'

export function useAppConfig() {
  return useContext(AppConfigContext)?.data ?? null
}

export function useAppConfigError() {
  return useContext(AppConfigContext)?.error ?? null
}
