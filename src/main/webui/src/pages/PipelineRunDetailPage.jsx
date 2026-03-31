import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PageSection,
  Title,
  Button,
  Spinner,
  Alert,
  Bullseye,
  Label,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table'
import { ArrowLeftIcon } from '@patternfly/react-icons'
import { api } from '../api/client'

const STATUS_COLOR = {
  Running: 'blue',
  Succeeded: 'green',
  Failed: 'red',
  Cancelled: 'orange',
  Pending: 'grey',
  Unknown: 'grey',
}

function formatDuration(s) {
  if (!s) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function PipelineRunDetailPage() {
  const { namespace, name } = useParams()
  const navigate = useNavigate()
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getPipelineRun(namespace, name)
      .then(setRun)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [namespace, name])

  return (
    <>
      <PageSection variant="light">
        <Button variant="link" icon={<ArrowLeftIcon />} isInline onClick={() => navigate(-1)}>
          Back
        </Button>
        <Title headingLevel="h1" size="2xl" style={{ marginTop: '12px' }}>
          {name}
        </Title>
        {run && (
          <span style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.9rem' }}>
            Pipeline: <strong>{run.pipelineName}</strong> &nbsp;·&nbsp; Namespace: <strong>{namespace}</strong>
          </span>
        )}
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Failed to load pipeline run" isInline>{error}</Alert>
        </PageSection>
      )}

      {loading ? (
        <PageSection>
          <Bullseye><Spinner size="xl" /></Bullseye>
        </PageSection>
      ) : run && (
        <PageSection>
          <Stack hasGutter>

            <StackItem>
              <Card>
                <CardTitle>Overview</CardTitle>
                <CardBody>
                  <DescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label color={STATUS_COLOR[run.status] || 'grey'} isCompact>{run.status}</Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Trigger</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label isCompact variant="outline">{run.triggerType || 'manual'}</Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Started</DescriptionListTerm>
                      <DescriptionListDescription>{formatTime(run.startTime)}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Completed</DescriptionListTerm>
                      <DescriptionListDescription>{formatTime(run.completionTime)}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Duration</DescriptionListTerm>
                      <DescriptionListDescription>{formatDuration(run.durationSeconds)}</DescriptionListDescription>
                    </DescriptionListGroup>
                    {run.reason && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Reason</DescriptionListTerm>
                        <DescriptionListDescription>{run.reason}</DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {run.gitBranch && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Git Branch</DescriptionListTerm>
                        <DescriptionListDescription>{run.gitBranch}</DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {run.gitCommit && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Git Commit</DescriptionListTerm>
                        <DescriptionListDescription>
                          <span style={{ fontFamily: 'monospace' }}>{run.gitCommit}</span>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>
                  {run.message && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}>
                      {run.message}
                    </div>
                  )}
                </CardBody>
              </Card>
            </StackItem>

            {run.taskRuns && run.taskRuns.length > 0 && (
              <StackItem>
                <Card>
                  <CardTitle>Tasks ({run.taskRuns.length})</CardTitle>
                  <CardBody>
                    <Table aria-label="Task runs">
                      <Thead>
                        <Tr>
                          <Th>Task</Th>
                          <Th>Status</Th>
                          <Th>Started</Th>
                          <Th>Duration</Th>
                          <Th>Pod</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {run.taskRuns.map((tr) => (
                          <Tr key={tr.name}>
                            <Td dataLabel="Task">
                              <div style={{ fontWeight: 600 }}>{tr.taskName}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>{tr.name}</div>
                            </Td>
                            <Td dataLabel="Status">
                              <Label color={STATUS_COLOR[tr.status] || 'grey'} isCompact>{tr.status}</Label>
                            </Td>
                            <Td dataLabel="Started">{formatTime(tr.startTime)}</Td>
                            <Td dataLabel="Duration">{formatDuration(tr.durationSeconds)}</Td>
                            <Td dataLabel="Pod">
                              {tr.podName
                                ? <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tr.podName}</span>
                                : '—'}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </StackItem>
            )}

          </Stack>
        </PageSection>
      )}
    </>
  )
}
