import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageSection,
  Title,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Spinner,
  Alert,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Label,
} from '@patternfly/react-core'
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table'
import {
  SyncAltIcon,
  PlayIcon,
  TasksIcon,
} from '@patternfly/react-icons'
import { api } from '../api/client'

const NAMESPACE = import.meta.env.VITE_NAMESPACE || 'bmeklund-dev'

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

export default function PipelinesPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [triggerModal, setTriggerModal] = useState(false)
  const [triggerForm, setTriggerForm] = useState({ pipelineName: '', gitRevision: 'main', gitUrl: '' })
  const [triggering, setTriggering] = useState(false)

  const fetchRuns = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.listPipelineRuns(NAMESPACE)
      setRuns(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRuns() }, [])

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      await api.triggerPipelineRun(NAMESPACE, {
        pipelineName: triggerForm.pipelineName,
        namespace: NAMESPACE,
        gitRevision: triggerForm.gitRevision || undefined,
        gitUrl: triggerForm.gitUrl || undefined,
      })
      setTriggerModal(false)
      setTriggerForm({ pipelineName: '', gitRevision: 'main', gitUrl: '' })
      await fetchRuns()
    } catch (e) {
      setError(e.message)
    } finally {
      setTriggering(false)
    }
  }

  const columns = ['Name', 'Pipeline', 'Status', 'Started', 'Duration', 'Trigger']

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">Pipeline Runs</Title>
        <p style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '4px' }}>
          Namespace: <strong>{NAMESPACE}</strong>
        </p>
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Error" isInline>{error}</Alert>
        </PageSection>
      )}

      <PageSection>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button variant="secondary" icon={<SyncAltIcon />} onClick={fetchRuns} isLoading={loading}>
                Refresh
              </Button>
            </ToolbarItem>
            <ToolbarItem align={{ default: 'alignRight' }}>
              <Button variant="primary" icon={<PlayIcon />} onClick={() => setTriggerModal(true)}>
                Trigger Run
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {loading ? (
          <Bullseye style={{ padding: '48px' }}><Spinner size="xl" /></Bullseye>
        ) : runs.length === 0 ? (
          <EmptyState titleText="No pipeline runs" headingLevel="h2" icon={TasksIcon}>
            <EmptyStateBody>No pipeline runs found in &quot;{NAMESPACE}&quot;.</EmptyStateBody>
          </EmptyState>
        ) : (
          <Table aria-label="Pipeline runs">
            <Thead>
              <Tr>{columns.map((c) => <Th key={c}>{c}</Th>)}</Tr>
            </Thead>
            <Tbody>
              {runs.map((run) => (
                <Tr
                  key={run.name}
                  className="clickable-row"
                  onClick={() => navigate(`/pipelines/${run.namespace}/${run.name}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Td dataLabel="Name">
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{run.name}</span>
                  </Td>
                  <Td dataLabel="Pipeline">{run.pipelineName}</Td>
                  <Td dataLabel="Status">
                    <Label color={STATUS_COLOR[run.status] || 'grey'} isCompact>{run.status}</Label>
                  </Td>
                  <Td dataLabel="Started">{formatTime(run.startTime)}</Td>
                  <Td dataLabel="Duration">{formatDuration(run.durationSeconds)}</Td>
                  <Td dataLabel="Trigger">
                    <Label isCompact variant="outline">{run.triggerType || 'manual'}</Label>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </PageSection>

      <Modal
        variant={ModalVariant.medium}
        title="Trigger Pipeline Run"
        isOpen={triggerModal}
        onClose={() => setTriggerModal(false)}
        actions={[
          <Button key="trigger" variant="primary" onClick={handleTrigger} isLoading={triggering}>
            Trigger
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setTriggerModal(false)}>
            Cancel
          </Button>,
        ]}
      >
        <Form>
          <FormGroup label="Pipeline Name" fieldId="pipeline-name" isRequired>
            <TextInput
              id="pipeline-name"
              value={triggerForm.pipelineName}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, pipelineName: v }))}
              placeholder="e.g. build-and-deploy"
            />
          </FormGroup>
          <FormGroup label="Git Revision" fieldId="git-revision">
            <TextInput
              id="git-revision"
              value={triggerForm.gitRevision}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, gitRevision: v }))}
              placeholder="main"
            />
          </FormGroup>
          <FormGroup label="Git URL" fieldId="git-url">
            <TextInput
              id="git-url"
              value={triggerForm.gitUrl}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, gitUrl: v }))}
              placeholder="https://github.com/org/repo.git"
            />
          </FormGroup>
        </Form>
      </Modal>
    </>
  )
}
