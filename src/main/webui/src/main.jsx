import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppConfigProvider } from './context/AppConfigContext'

// PatternFly base styles
import '@patternfly/react-core/dist/styles/base.css'
import './app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppConfigProvider>
        <App />
      </AppConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
