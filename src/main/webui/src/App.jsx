import { useState } from 'react'
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadToggle,
  PageToggleButton,
  Nav,
  NavList,
  NavItem,
  PageSidebar,
  PageSidebarBody,
  Alert,
  PageSection,
} from '@patternfly/react-core'
import {
  TachometerAltIcon,
  TasksIcon,
  HeartbeatIcon,
  CogIcon,
  BarsIcon,
} from '@patternfly/react-icons'

import quarkusLogo from './assets/quarkus_logo.png'
import Dashboard from './pages/Dashboard'
import PipelinesPage from './pages/PipelinesPage'
import PipelineRunDetailPage from './pages/PipelineRunDetailPage'
import HealthPage from './pages/HealthPage'
import ConfigPage from './pages/ConfigPage'
import { useAppConfigError } from './context/AppConfigContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: <TachometerAltIcon /> },
  { to: '/pipelines', label: 'Pipelines', icon: <TasksIcon /> },
  { to: '/health', label: 'Health', icon: <HeartbeatIcon /> },
  { to: '/config', label: 'Configuration', icon: <CogIcon /> },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const configError = useAppConfigError()
  const { pathname } = useLocation()

  const isNavItemActive = (to) => (
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
  )

  const masthead = (
    <Masthead style={{ backgroundColor: '#151515', position: 'relative' }}>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
            isSidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen((o) => !o)}
            style={{ color: 'white' }}
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <Link to="/">
            <img src={quarkusLogo} alt="Quarkus" style={{ height: '36px' }} />
          </Link>
        </MastheadBrand>
      </MastheadMain>
      <span style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontWeight: 700,
        fontSize: '1.4rem',
        whiteSpace: 'nowrap',
        paddingTop: '15px',
      }}>
        Quarkus Pipelines App
      </span>
    </Masthead>
  )

  const sidebar = (
    <PageSidebar isSidebarOpen={sidebarOpen} style={{ backgroundColor: '#a9a5a5' }}>
      <PageSidebarBody>
        <Nav aria-label="Main navigation">
          <NavList>
            {navItems.map(({ to, label, icon }) => (
              <NavItem key={to} isActive={isNavItemActive(to)}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className="app-nav-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    padding: '8px 16px',
                  }}
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
    <Page masthead={masthead} sidebar={sidebar} isSidebarOpen={sidebarOpen}>
      {configError && (
        <PageSection>
          <Alert variant="danger" title="Failed to load application configuration" isInline>{configError}</Alert>
        </PageSection>
      )}
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
