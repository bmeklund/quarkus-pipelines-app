import { useEffect, useRef, useState } from 'react'
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Split,
  SplitItem,
  Flex,
  FlexItem,
} from '@patternfly/react-core'
import {
  CheckCircleIcon,
  TimesCircleIcon,
  SyncAltIcon,
  TasksIcon,
  BanIcon,
} from '@patternfly/react-icons'
import { api } from '../api/client'
import PipelineStatusCard from '../components/PipelineStatusCard'

const NAMESPACE = import.meta.env.VITE_NAMESPACE || 'bmeklund-dev'

export default function Dashboard() {
  const [allRuns, setAllRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchingRef = useRef(false)

  const fetchData = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      setLoading(true)
      setError(null)
      const runs = await api.listPipelineRuns(NAMESPACE)
      setAllRuns(runs)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = {
    total: allRuns.length,
    succeeded: allRuns.filter((r) => r.status === 'Succeeded').length,
    cancelled: allRuns.filter((r) => r.status === 'Cancelled').length,
    failed: allRuns.filter((r) => r.status === 'Failed').length,
    running: allRuns.filter((r) => r.status === 'Running').length,
  }

  const recentRuns = allRuns.slice(0, 6)

  return (
    <>
      <PageSection variant="light">
        <Split hasGutter>
          <SplitItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">Pipeline Dashboard</Title>
            <p style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '4px' }}>
              Overview of OpenShift Pipeline activity in <strong>{NAMESPACE}</strong>
            </p>
          </SplitItem>
          <SplitItem>
            <Button variant="primary" icon={<SyncAltIcon />} onClick={fetchData} isLoading={loading}>
              Refresh
            </Button>
          </SplitItem>
        </Split>
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Failed to load pipeline data" isInline>{error}</Alert>
        </PageSection>
      )}

      <PageSection>
        <Flex hasGutter>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Total Runs" value={stats.total} icon={<TasksIcon />} color="var(--pf-v6-global--Color--100)" />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Succeeded" value={stats.succeeded} icon={<CheckCircleIcon />} color="#3E8635" />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Cancelled" value={stats.cancelled} icon={<BanIcon />} color="#F0AB00" />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Failed" value={stats.failed} icon={<TimesCircleIcon />} color="#C9190B" />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Running" value={stats.running} icon={<SyncAltIcon />} color="#0066CC" />
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>Recent Pipeline Runs</Title>
        {loading ? (
          <Bullseye><Spinner size="xl" /></Bullseye>
        ) : recentRuns.length === 0 ? (
          <EmptyState titleText="No pipeline runs found" headingLevel="h2" icon={TasksIcon}>
            <EmptyStateBody>No pipeline runs found in &quot;{NAMESPACE}&quot;.</EmptyStateBody>
          </EmptyState>
        ) : (
          <Grid hasGutter>
            {recentRuns.map((run) => (
              <GridItem key={run.name} span={12} md={6} xl={4}>
                <PipelineStatusCard run={run} />
              </GridItem>
            ))}
          </Grid>
        )}
      </PageSection>
    </>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <Card isCompact>
      <CardBody>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <div style={{ fontSize: '2rem', color }}>{icon}</div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.9rem' }}>{title}</div>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  )
}
