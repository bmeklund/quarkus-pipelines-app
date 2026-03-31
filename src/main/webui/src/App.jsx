import { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  Nav,
  NavList,
  NavItem,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core'
import {
  TachometerAltIcon,
  TasksIcon,
  HeartbeatIcon,
  CogIcon,
} from '@patternfly/react-icons'

import Dashboard from './pages/Dashboard'
import PipelinesPage from './pages/PipelinesPage'
import PipelineRunDetailPage from './pages/PipelineRunDetailPage'
import HealthPage from './pages/HealthPage'
import ConfigPage from './pages/ConfigPage'

const navItems = [
  { to: '/', label: 'Dashboard', icon: <TachometerAltIcon /> },
  { to: '/pipelines', label: 'Pipelines', icon: <TasksIcon /> },
  { to: '/health', label: 'Health', icon: <HeartbeatIcon /> },
  { to: '/config', label: 'Configuration', icon: <CogIcon /> },
]

export default function App() {
  const [sidebarOpen] = useState(true)
  const location = useLocation()

  const masthead = (
    <Masthead style={{ backgroundColor: '#151515' }}>
      <MastheadMain>
        <MastheadBrand>
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="18" fill="#EE0000" />
              <text x="18" y="23" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">RH</text>
            </svg>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
              Quarkus Pipelines App
            </span>
          </span>
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  )

  const sidebar = (
    <PageSidebar isSidebarOpen={sidebarOpen} style={{ backgroundColor: '#a9a5a5' }}>
      <PageSidebarBody>
        <Nav aria-label="Main navigation">
          <NavList>
            {navItems.map(({ to, label, icon }) => (
              <NavItem key={to} isActive={location.pathname === to}>
                <NavLink
                  to={to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isActive ? '#EE0000' : 'inherit',
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: 'none',
                    padding: '8px 16px',
                  })}
                >
                  {icon}
                  {label}
                </NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  )

  return (
    <Page masthead={masthead} sidebar={sidebar} isManagedSidebar>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipelines" element={<PipelinesPage />} />
        <Route path="/pipelines/:namespace/:name" element={<PipelineRunDetailPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </Page>
  )
}
