import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardBody,
  Spinner,
  Alert,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core'
import {
  CheckCircleIcon,
  TimesCircleIcon,
  SyncAltIcon,
  TasksIcon,
  BanIcon,
  ServerIcon,
  LayerGroupIcon,
} from '@patternfly/react-icons'
import { api } from '../api/client'
import PipelineStatusCard from '../components/PipelineStatusCard'
import { useAppConfig } from '../context/AppConfigContext'
import { getStatusAccentColor, normalizeStatus } from '../utils'

export default function Dashboard() {
  const config = useAppConfig()
  const namespace = config?.namespace
  const [allRuns, setAllRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!namespace || fetchingRef.current) return
    fetchingRef.current = true
    try {
      setLoading(true)
      setError(null)
      const runs = await api.listPipelineRuns(namespace)
      setAllRuns(runs)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [namespace])

  useEffect(() => {
    if (!namespace) return
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const stats = {
    total: allRuns.length,
    succeeded: allRuns.filter((r) => normalizeStatus(r.status) === 'Succeeded').length,
    cancelled: allRuns.filter((r) => normalizeStatus(r.status) === 'Cancelled').length,
    failed: allRuns.filter((r) => normalizeStatus(r.status) === 'Failed').length,
    running: allRuns.filter((r) => normalizeStatus(r.status) === 'Running').length,
  }

  const recentRuns = allRuns.slice(0, 6)

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl" style={{ marginBottom: '16px' }}>Pipeline Dashboard</Title>
        <Card style={{ border: '1px solid var(--pf-t--global--color--status--info--default)', borderRadius: '8px' }}>
          <CardBody>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapLg' }}>
              <FlexItem>
                <Label color="green" icon={<CheckCircleIcon />}>Connected</Label>
              </FlexItem>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem><LayerGroupIcon style={{ color: 'var(--pf-t--global--color--status--info--default)' }} /></FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: '0.8rem', color: 'var(--pf-t--global--text--color--200)' }}>Namespace</span>
                    <div style={{ fontWeight: 700 }}>{namespace}</div>
                  </FlexItem>
                </Flex>
              </FlexItem>
              {config?.['api-server-url'] && (
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    <FlexItem><ServerIcon style={{ color: '#4695EB' }} /></FlexItem>
                    <FlexItem>
                      <span style={{ fontSize: '0.8rem', color: 'var(--pf-t--global--text--color--200)' }}>API Server / Cluster</span>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{config['api-server-url']}</div>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              )}
            </Flex>
          </CardBody>
        </Card>
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Failed to load pipeline data" isInline>{error}</Alert>
        </PageSection>
      )}

      <PageSection>
        <Flex hasGutter>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Total Runs" value={stats.total} icon={<TasksIcon />} color="var(--pf-t--global--text--color--100)" />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Succeeded" value={stats.succeeded} icon={<CheckCircleIcon />} color={getStatusAccentColor('Succeeded')} />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Cancelled" value={stats.cancelled} icon={<BanIcon />} color={getStatusAccentColor('Cancelled')} />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Failed" value={stats.failed} icon={<TimesCircleIcon />} color={getStatusAccentColor('Failed')} />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <StatCard title="Running" value={stats.running} icon={<SyncAltIcon />} color={getStatusAccentColor('Running')} />
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>Recent Pipeline Runs</Title>
        {loading ? (
          <Bullseye><Spinner size="xl" /></Bullseye>
        ) : recentRuns.length === 0 ? (
          <EmptyState titleText="No pipeline runs found" headingLevel="h2" icon={TasksIcon}>
            <EmptyStateBody>No pipeline runs found in &quot;{namespace}&quot;.</EmptyStateBody>
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
            <div style={{ color: 'var(--pf-t--global--text--color--200)', fontSize: '0.9rem' }}>{title}</div>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  )
}
