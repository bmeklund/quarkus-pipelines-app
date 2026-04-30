import { useNavigate } from 'react-router-dom'
import { formatDuration, formatTime, getStatusAccentColor, getStatusLabelColor, normalizeStatus } from '../utils'
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
    color: getStatusLabelColor('Running'),
    icon: <SyncAltIcon />,
  },
  Succeeded: {
    color: getStatusLabelColor('Succeeded'),
    icon: <CheckCircleIcon />,
  },
  Failed: {
    color: getStatusLabelColor('Failed'),
    icon: <TimesCircleIcon />,
  },
  Cancelled: {
    color: getStatusLabelColor('Cancelled'),
    icon: <BanIcon />,
  },
  Pending: {
    color: getStatusLabelColor('Pending'),
    icon: <OutlinedPlayCircleIcon />,
  },
  Unknown: {
    color: getStatusLabelColor('Unknown'),
    icon: <QuestionCircleIcon />,
  },
}


export default function PipelineStatusCard({ run }) {
  const navigate = useNavigate()
  const normalizedStatus = normalizeStatus(run.status)
  const cfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.Unknown
  const isRunning = run.status === 'Running'
  const detailPath = `/pipelines/${encodeURIComponent(run.namespace)}/${encodeURIComponent(run.name)}`

  return (
    <Card
      isCompact
      isClickable
      onClick={() => navigate(detailPath)}
      style={{
        borderLeft: `4px solid ${getStatusAccentColor(run.status)}`,
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
            <span style={{ fontSize: '0.8rem', color: 'var(--pf-t--global--text--color--200)' }}>
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
                  color: run.status === 'Failed' ? 'var(--pf-t--global--color--status--danger--default)' : 'var(--pf-t--global--text--color--200)',
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--pf-t--global--text--color--200)' }}>
                    <ClockIcon style={{ marginRight: '4px' }} />
                    {formatTime(run.startTime)}
                  </span>
                </Tooltip>
              </FlexItem>
              {run.durationSeconds != null && (
                <FlexItem>
                  <span style={{ fontSize: '0.8rem', color: 'var(--pf-t--global--text--color--200)' }}>
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
                  const trCfg = STATUS_CONFIG[normalizeStatus(tr.status)] || STATUS_CONFIG.Unknown
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
        <Button
          variant="link"
          isInline
          size="sm"
          onClick={(e) => { e.stopPropagation(); navigate(detailPath) }}
        >
          Details
        </Button>
      </CardFooter>
    </Card>
  )
}
