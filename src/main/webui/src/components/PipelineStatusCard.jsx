import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Label,
  Button,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Flex,
  FlexItem,
  Tooltip,
} from '@patternfly/react-core'
import {
  CheckCircleIcon,
  TimesCircleIcon,
  SyncAltIcon,
  BanIcon,
  QuestionCircleIcon,
  ClockIcon,
  OutlinedPlayCircleIcon,
} from '@patternfly/react-icons'

const STATUS_CONFIG = {
  Running: {
    color: 'blue',
    icon: <SyncAltIcon />,
    spin: true,
  },
  Succeeded: {
    color: 'green',
    icon: <CheckCircleIcon />,
  },
  Failed: {
    color: 'red',
    icon: <TimesCircleIcon />,
  },
  Cancelled: {
    color: 'orange',
    icon: <BanIcon />,
  },
  Pending: {
    color: 'grey',
    icon: <OutlinedPlayCircleIcon />,
  },
  Unknown: {
    color: 'grey',
    icon: <QuestionCircleIcon />,
  },
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatTimestamp(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString()
}

export default function PipelineStatusCard({ run }) {
  const navigate = useNavigate()
  const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.Unknown
  const isRunning = run.status === 'Running'

  return (
    <Card
      isCompact
      isClickable
      onClick={() => navigate(`/pipelines/${run.namespace}/${run.name}`)}
      style={{
        borderLeft: `4px solid ${
          run.status === 'Failed' ? '#C9190B'
          : run.status === 'Succeeded' ? '#3E8635'
          : run.status === 'Cancelled' ? '#F0AB00'
          : '#4695EB'
        }`,
        cursor: 'pointer',
      }}
    >
      <CardTitle>
        <Split hasGutter>
          <SplitItem isFilled>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {run.name}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--pf-v6-global--Color--200)' }}>
              {run.pipelineName}
            </span>
          </SplitItem>
          <SplitItem>
            <Label
              color={cfg.color}
              icon={cfg.icon}
              isCompact
            >
              {run.status}
            </Label>
          </SplitItem>
        </Split>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          {run.message && (
            <StackItem>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: run.status === 'Failed' ? 'var(--pf-v6-global--danger-color--100)' : 'var(--pf-v6-global--Color--200)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {run.message}
              </span>
            </StackItem>
          )}
          <StackItem>
            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem>
                <Tooltip content="Start time">
                  <span style={{ fontSize: '0.8rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    <ClockIcon style={{ marginRight: '4px' }} />
                    {formatTimestamp(run.startTime)}
                  </span>
                </Tooltip>
              </FlexItem>
              {run.durationSeconds != null && (
                <FlexItem>
                  <span style={{ fontSize: '0.8rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    {isRunning ? 'Running for: ' : 'Duration: '}
                    {formatDuration(run.durationSeconds)}
                  </span>
                </FlexItem>
              )}
            </Flex>
          </StackItem>
          {(run.gitBranch || run.gitCommit) && (
            <StackItem>
              <Flex gap={{ default: 'gapSm' }}>
                {run.gitBranch && (
                  <FlexItem>
                    <Label isCompact variant="outline" color="blue">
                      {run.gitBranch}
                    </Label>
                  </FlexItem>
                )}
                {run.gitCommit && (
                  <FlexItem>
                    <Label isCompact variant="outline">
                      {run.gitCommit.substring(0, 7)}
                    </Label>
                  </FlexItem>
                )}
              </Flex>
            </StackItem>
          )}
          {run.taskRuns && run.taskRuns.length > 0 && (
            <StackItem>
              <Flex gap={{ default: 'gapXs' }}>
                {run.taskRuns.map((tr) => {
                  const trCfg = STATUS_CONFIG[tr.status] || STATUS_CONFIG.Unknown
                  return (
                    <FlexItem key={tr.name}>
                      <Tooltip content={`${tr.taskName}: ${tr.status}`}>
                        <Label isCompact color={trCfg.color} icon={trCfg.icon}>
                          {tr.taskName}
                        </Label>
                      </Tooltip>
                    </FlexItem>
                  )
                })}
              </Flex>
            </StackItem>
          )}
        </Stack>
      </CardBody>
      <CardFooter>
        <Button variant="link" isInline size="sm" onClick={() => navigate(`/pipelines/${run.namespace}/${run.name}`)}>
          Details
        </Button>
      </CardFooter>
    </Card>
  )
}
