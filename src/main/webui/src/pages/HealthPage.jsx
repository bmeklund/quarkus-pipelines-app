import { useCallback, useEffect, useState } from 'react'
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Label,
  Button,
  Spinner,
  Alert,
  Bullseye,
  Split,
  SplitItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
} from '@patternfly/react-core'
import { CheckCircleIcon, TimesCircleIcon, SyncAltIcon, HeartbeatIcon } from '@patternfly/react-icons'
import { api } from '../api/client'
import { formatTimeOnly } from '../utils'

export default function HealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getHealth()
      setHealth(data)
      setLastChecked(new Date().toISOString())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 120000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  const overallUp = health?.status === 'UP'

  return (
    <>
      <PageSection variant="light">
        <Split hasGutter>
          <SplitItem isFilled>
            <Title headingLevel="h1" size="2xl">
              <HeartbeatIcon style={{ marginRight: '8px' }} />
              Health
            </Title>
            {lastChecked && (
              <p style={{ color: 'var(--pf-t--global--text--color--200)', marginTop: '4px', fontSize: '0.85rem' }}>
                Last checked: {formatTimeOnly(lastChecked)} — auto-refreshes every 2m
              </p>
            )}
          </SplitItem>
          <SplitItem>
            <Button variant="secondary" icon={<SyncAltIcon />} onClick={fetchHealth} isLoading={loading}>
              Refresh
            </Button>
          </SplitItem>
        </Split>
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Failed to fetch health data" isInline>{error}</Alert>
        </PageSection>
      )}

      {loading && !health && (
        <PageSection><Bullseye><Spinner size="xl" /></Bullseye></PageSection>
      )}

      {health && (
        <>
          <PageSection>
            <Card isCompact>
              <CardBody>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapLg' }}>
                  <FlexItem>
                    {overallUp
                      ? <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" style={{ fontSize: '3rem' }} />
                      : <TimesCircleIcon color="var(--pf-t--global--color--status--danger--default)" style={{ fontSize: '3rem' }} />
                    }
                  </FlexItem>
                  <FlexItem>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                      Overall Status
                    </div>
                    <Label
                      color={overallUp ? 'green' : 'red'}
                      icon={overallUp ? <CheckCircleIcon /> : <TimesCircleIcon />}
                      style={{ fontSize: '1rem', padding: '6px 12px' }}
                    >
                      {health.status}
                    </Label>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </PageSection>

          <PageSection>
            <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
              Health Checks
            </Title>
            <Grid hasGutter>
              {(health.checks || []).map((check) => (
                <GridItem key={check.name} span={12} md={6} xl={4}>
                  <HealthCheckCard check={check} />
                </GridItem>
              ))}
            </Grid>
          </PageSection>
        </>
      )}
    </>
  )
}

function HealthCheckCard({ check }) {
  const isUp = check.status === 'UP'
  return (
    <Card
      isCompact
      style={{
        borderLeft: `4px solid ${isUp ? 'var(--pf-t--global--color--status--success--default)' : 'var(--pf-t--global--color--status--danger--default)'}`,
      }}
    >
      <CardTitle>
        <Split hasGutter>
          <SplitItem isFilled>
            <span style={{ fontWeight: 600 }}>{check.name}</span>
          </SplitItem>
          <SplitItem>
            <Label color={isUp ? 'green' : 'red'} isCompact
              icon={isUp ? <CheckCircleIcon /> : <TimesCircleIcon />}>
              {check.status}
            </Label>
          </SplitItem>
        </Split>
      </CardTitle>
      {check.data && Object.keys(check.data).length > 0 && (
        <CardBody>
          <DescriptionList isCompact isHorizontal>
            {Object.entries(check.data).map(([k, v]) => (
              <DescriptionListGroup key={k}>
                <DescriptionListTerm>{k}</DescriptionListTerm>
                <DescriptionListDescription>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {String(v)}
                  </span>
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        </CardBody>
      )}
    </Card>
  )
}
