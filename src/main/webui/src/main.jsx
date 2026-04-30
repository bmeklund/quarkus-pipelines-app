import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppConfigProvider } from './context/AppConfigContext'

// PatternFly base styles
import '@patternfly/react-core/dist/styles/base.css'
import './app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppConfigProvider>
        <App />
      </AppConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
