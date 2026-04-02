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
  FormSelect,
  FormSelectOption,
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
import { useAppConfig } from '../context/AppConfigContext'

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
  const { namespace } = useAppConfig() ?? {}
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [triggerModal, setTriggerModal] = useState(false)
  const [triggerForm, setTriggerForm] = useState({ pipelineName: '', appName: '', appVersion: '', workspaceName: 'shared-data', workspaceStorageSize: '1Gi' })
  const [triggering, setTriggering] = useState(false)
  const [triggerError, setTriggerError] = useState(null)
  const [pipelines, setPipelines] = useState([])
  const [pipelinesLoading, setPipelinesLoading] = useState(false)

  const fetchRuns = async () => {
    if (!namespace) return
    try {
      setLoading(true)
      setError(null)
      const data = await api.listPipelineRuns(namespace)
      setRuns([...data].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRuns() }, [namespace])

  const openTriggerModal = async () => {
    setTriggerForm({ pipelineName: '', appName: '', appVersion: '', workspaceName: 'shared-data', workspaceStorageSize: '1Gi' })
    setTriggerError(null)
    setTriggerModal(true)
    setPipelinesLoading(true)
    try {
      const names = await api.listPipelines(namespace)
      setPipelines(names)
      if (names.length > 0) setTriggerForm((f) => ({ ...f, pipelineName: names[0] }))
    } catch {
      setPipelines([])
    } finally {
      setPipelinesLoading(false)
    }
  }

  const closeTriggerModal = () => {
    setTriggerModal(false)
    setTriggerError(null)
  }

  const handleTrigger = async () => {
    if (!triggerForm.pipelineName) {
      setTriggerError('Pipeline name is required.')
      return
    }
    setTriggering(true)
    setTriggerError(null)
    try {
      const params = {}
      if (triggerForm.appName) params['application-name'] = triggerForm.appName
      if (triggerForm.appVersion) params['application-version'] = triggerForm.appVersion
      await api.triggerPipelineRun(namespace, {
        pipelineName: triggerForm.pipelineName,
        namespace: namespace,
        params,
        workspaceName: triggerForm.workspaceName || undefined,
        workspaceStorageSize: triggerForm.workspaceStorageSize || undefined,
      })
      closeTriggerModal()
      await fetchRuns()
    } catch (e) {
      setTriggerError(e.message)
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
          Namespace: <strong>{namespace}</strong>
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
              <Button variant="primary" icon={<PlayIcon />} onClick={openTriggerModal} style={{ backgroundColor: '#4695EB', borderColor: '#4695EB' }}>
                Trigger Run
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {loading ? (
          <Bullseye style={{ padding: '48px' }}><Spinner size="xl" /></Bullseye>
        ) : runs.length === 0 ? (
          <EmptyState titleText="No pipeline runs" headingLevel="h2" icon={TasksIcon}>
            <EmptyStateBody>No pipeline runs found in &quot;{namespace}&quot;.</EmptyStateBody>
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
        variant={ModalVariant.large}
        title="Trigger Pipeline Run"
        isOpen={triggerModal}
        onClose={closeTriggerModal}
      >
        <div style={{ padding: '16px 24px' }}>
        {triggerError && <Alert variant="danger" title={triggerError} isInline style={{ marginBottom: '16px' }} />}
        <Form>
          <FormGroup label="Pipeline" fieldId="pipeline-name" isRequired>
            {pipelinesLoading ? (
              <Spinner size="sm" />
            ) : pipelines.length > 0 ? (
              <FormSelect
                id="pipeline-name"
                value={triggerForm.pipelineName}
                onChange={(_, v) => setTriggerForm((f) => ({ ...f, pipelineName: v }))}
              >
                {pipelines.map((p) => (
                  <FormSelectOption key={p} value={p} label={p} />
                ))}
              </FormSelect>
            ) : (
              <TextInput
                id="pipeline-name"
                value={triggerForm.pipelineName}
                onChange={(_, v) => setTriggerForm((f) => ({ ...f, pipelineName: v }))}
                placeholder="e.g. build-and-deploy"
              />
            )}
          </FormGroup>
          <FormGroup label="Application Name" fieldId="app-name">
            <TextInput
              id="app-name"
              value={triggerForm.appName}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, appName: v }))}
              placeholder="e.g. my-app"
            />
          </FormGroup>
          <FormGroup label="Application Version" fieldId="app-version">
            <TextInput
              id="app-version"
              value={triggerForm.appVersion}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, appVersion: v }))}
              placeholder="e.g. 1.0.0"
            />
          </FormGroup>
          <FormGroup label="Workspace Name" fieldId="workspace-name" helperText="Name of the workspace defined in the pipeline">
            <TextInput
              id="workspace-name"
              value={triggerForm.workspaceName}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, workspaceName: v }))}
            />
          </FormGroup>
          <FormGroup label="Workspace Storage Size" fieldId="workspace-storage" helperText="VolumeClaimTemplate size — e.g. 1Gi, 500Mi">
            <TextInput
              id="workspace-storage"
              value={triggerForm.workspaceStorageSize}
              onChange={(_, v) => setTriggerForm((f) => ({ ...f, workspaceStorageSize: v }))}
            />
          </FormGroup>
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <Button variant="primary" onClick={handleTrigger} isLoading={triggering} style={{ backgroundColor: '#4695EB', borderColor: '#4695EB' }}>
              Start Pipeline Run
            </Button>
            <Button variant="link" onClick={closeTriggerModal}>
              Cancel
            </Button>
          </div>
        </Form>
        </div>
      </Modal>
    </>
  )
}
