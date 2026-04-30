import { useCallback, useEffect, useState } from 'react'
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
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
  Label,
  Grid,
  GridItem,
} from '@patternfly/react-core'
import { SyncAltIcon, CogIcon } from '@patternfly/react-icons'
import { api } from '../api/client'

export default function ConfigPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setConfig(await api.getConfig())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  return (
    <>
      <PageSection variant="light">
        <Split hasGutter>
          <SplitItem isFilled>
            <Title headingLevel="h1" size="2xl">
              <CogIcon style={{ marginRight: '8px' }} />
              Configuration
            </Title>
            <p style={{ color: 'var(--pf-t--global--text--color--200)', marginTop: '4px' }}>
              Application configuration (non-sensitive properties)
            </p>
          </SplitItem>
          <SplitItem>
            <Button variant="secondary" icon={<SyncAltIcon />} onClick={fetchConfig} isLoading={loading}>
              Refresh
            </Button>
          </SplitItem>
        </Split>
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Failed to load configuration" isInline>{error}</Alert>
        </PageSection>
      )}

      {loading && !config && (
        <PageSection><Bullseye><Spinner size="xl" /></Bullseye></PageSection>
      )}

      {config && (
        <PageSection>
          <Grid hasGutter>
            <GridItem span={12} md={6}>
              <Card isCompact>
                <CardTitle style={{ borderBottom: '1px solid var(--pf-t--global--border--color--100)', paddingBottom: '12px' }}>Application</CardTitle>
                <CardBody>
                  <DescriptionList isHorizontal isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        <span style={{ fontFamily: 'monospace' }}>{config['application.name']}</span>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Version</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label isCompact variant="outline">{config['application.version']}</Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>HTTP Port</DescriptionListTerm>
                      <DescriptionListDescription>{config['http.port']}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={12} md={6}>
              <Card isCompact>
                <CardTitle style={{ borderBottom: '1px solid var(--pf-t--global--border--color--100)', paddingBottom: '12px' }}>Pipelines</CardTitle>
                <CardBody>
                  <DescriptionList isHorizontal isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Active Namespace</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label isCompact color="blue">{config.namespace}</Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Dashboard Refresh</DescriptionListTerm>
                      <DescriptionListDescription>30s</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Pipelines Page Refresh</DescriptionListTerm>
                      <DescriptionListDescription>manual only</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={12} md={6}>
              <Card isCompact>
                <CardTitle style={{ borderBottom: '1px solid var(--pf-t--global--border--color--100)', paddingBottom: '12px' }}>Runtime</CardTitle>
                <CardBody>
                  <DescriptionList isHorizontal isCompact>
                    {config.runtime && Object.entries(config.runtime).map(([k, v]) => (
                      <DescriptionListGroup key={k}>
                        <DescriptionListTerm>{k}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{String(v)}</span>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    ))}
                  </DescriptionList>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </PageSection>
      )}
    </>
  )
}
