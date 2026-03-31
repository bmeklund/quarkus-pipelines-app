package com.redhat.pipelines.service;

import com.redhat.pipelines.model.PipelineRunSummary;
import com.redhat.pipelines.model.TaskRunSummary;
import com.redhat.pipelines.model.TriggerRequest;
import io.fabric8.tekton.client.TektonClient;
import io.fabric8.tekton.pipeline.v1.PipelineRun;
import io.fabric8.tekton.pipeline.v1.PipelineRunBuilder;
import io.fabric8.tekton.pipeline.v1.TaskRun;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class PipelineRunService {

    private static final Logger LOG = Logger.getLogger(PipelineRunService.class);

    @Inject
    TektonClient tektonClient;

    public List<PipelineRunSummary> listPipelineRuns(String namespace) {
        LOG.infof("listPipelineRuns() called for namespace: %s", namespace);
        try {
            var runs = tektonClient.v1().pipelineRuns()
                    .inNamespace(namespace)
                    .list()
                    .getItems();
            LOG.infof("Got %d pipeline runs", runs.size());
            return runs.stream()
                    .map(this::toSummary)
                    .sorted(Comparator.comparing(
                            s -> s.startTime() != null ? s.startTime() : Instant.EPOCH,
                            Comparator.reverseOrder()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            LOG.warnf("Failed to list PipelineRuns in namespace %s: %s", namespace, e.getMessage());
            return Collections.emptyList();
        }
    }

    public Optional<PipelineRunSummary> getPipelineRun(String namespace, String name) {
        try {
            var run = tektonClient.v1().pipelineRuns()
                    .inNamespace(namespace)
                    .withName(name)
                    .get();
            return Optional.ofNullable(run).map(this::toSummaryWithDetails);
        } catch (Exception e) {
            LOG.warnf("Failed to get PipelineRun %s/%s: %s", namespace, name, e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<PipelineRunSummary> triggerPipelineRun(TriggerRequest request) {
        try {
            var paramsBuilder = new ArrayList<io.fabric8.tekton.pipeline.v1.Param>();
            if (request.params() != null) {
                request.params().forEach((k, v) -> paramsBuilder.add(
                        new io.fabric8.tekton.pipeline.v1.ParamBuilder()
                                .withName(k)
                                .withNewValue(v)
                                .build()));
            }
            if (request.gitRevision() != null) {
                paramsBuilder.add(new io.fabric8.tekton.pipeline.v1.ParamBuilder()
                        .withName("revision").withNewValue(request.gitRevision()).build());
            }
            if (request.gitUrl() != null) {
                paramsBuilder.add(new io.fabric8.tekton.pipeline.v1.ParamBuilder()
                        .withName("url").withNewValue(request.gitUrl()).build());
            }

            var pipelineRun = new PipelineRunBuilder()
                    .withNewMetadata()
                        .withGenerateName(request.pipelineName() + "-run-")
                        .withNamespace(request.namespace())
                        .addToLabels("app.kubernetes.io/managed-by", "quarkus-pipelines-app")
                    .endMetadata()
                    .withNewSpec()
                        .withNewPipelineRef().withName(request.pipelineName()).endPipelineRef()
                        .withParams(paramsBuilder)
                    .endSpec()
                    .build();

            var created = tektonClient.v1().pipelineRuns()
                    .inNamespace(request.namespace())
                    .resource(pipelineRun)
                    .create();

            return Optional.ofNullable(created).map(this::toSummary);
        } catch (Exception e) {
            LOG.errorf("Failed to trigger PipelineRun for %s in %s: %s",
                    request.pipelineName(), request.namespace(), e.getMessage());
            return Optional.empty();
        }
    }

    private PipelineRunSummary toSummary(PipelineRun pr) {
        var meta = pr.getMetadata();
        var spec = pr.getSpec();
        var status = pr.getStatus();

        String pipelineName = spec != null && spec.getPipelineRef() != null
                ? spec.getPipelineRef().getName() : "unknown";

        String runStatus = resolveStatus(pr);
        String reason = null;
        String message = null;
        Instant startTime = null;
        Instant completionTime = null;

        if (status != null) {
            var conditions = status.getConditions();
            if (conditions != null && !conditions.isEmpty()) {
                var cond = conditions.get(0);
                reason = cond.getReason();
                message = cond.getMessage();
            }
            if (status.getStartTime() != null) {
                startTime = ZonedDateTime.parse(status.getStartTime()).toInstant();
            }
            if (status.getCompletionTime() != null) {
                completionTime = ZonedDateTime.parse(status.getCompletionTime()).toInstant();
            }
        }

        Long duration = null;
        if (startTime != null && completionTime != null) {
            duration = completionTime.getEpochSecond() - startTime.getEpochSecond();
        } else if (startTime != null && PipelineRunSummary.STATUS_RUNNING.equals(runStatus)) {
            duration = Instant.now().getEpochSecond() - startTime.getEpochSecond();
        }

        List<TaskRunSummary> taskRunSummaries = buildTaskRunSummaries(pr);

        Map<String, String> labels = meta.getLabels() != null ? meta.getLabels() : Map.of();
        Map<String, String> annotations = meta.getAnnotations() != null ? meta.getAnnotations() : Map.of();
        String gitCommit = annotations.getOrDefault("tekton.dev/git-commit",
                labels.getOrDefault("git-commit", null));
        String gitBranch = annotations.getOrDefault("tekton.dev/git-branch",
                labels.getOrDefault("git-branch", null));
        String triggerType = labels.getOrDefault("triggers.tekton.dev/eventlistener", "manual");

        return new PipelineRunSummary(
                meta.getName(),
                meta.getNamespace(),
                pipelineName,
                runStatus,
                reason,
                message,
                startTime,
                completionTime,
                duration,
                taskRunSummaries,
                gitCommit,
                gitBranch,
                triggerType
        );
    }

    private PipelineRunSummary toSummaryWithDetails(PipelineRun pr) {
        var meta = pr.getMetadata();
        var spec = pr.getSpec();
        var status = pr.getStatus();

        String pipelineName = spec != null && spec.getPipelineRef() != null
                ? spec.getPipelineRef().getName() : "unknown";

        String runStatus = resolveStatus(pr);
        String reason = null;
        String message = null;
        Instant startTime = null;
        Instant completionTime = null;

        if (status != null) {
            var conditions = status.getConditions();
            if (conditions != null && !conditions.isEmpty()) {
                var cond = conditions.get(0);
                reason = cond.getReason();
                message = cond.getMessage();
            }
            if (status.getStartTime() != null) {
                startTime = ZonedDateTime.parse(status.getStartTime()).toInstant();
            }
            if (status.getCompletionTime() != null) {
                completionTime = ZonedDateTime.parse(status.getCompletionTime()).toInstant();
            }
        }

        Long duration = null;
        if (startTime != null && completionTime != null) {
            duration = completionTime.getEpochSecond() - startTime.getEpochSecond();
        } else if (startTime != null && PipelineRunSummary.STATUS_RUNNING.equals(runStatus)) {
            duration = Instant.now().getEpochSecond() - startTime.getEpochSecond();
        }

        Map<String, String> labels = meta.getLabels() != null ? meta.getLabels() : Map.of();
        Map<String, String> annotations = meta.getAnnotations() != null ? meta.getAnnotations() : Map.of();
        String gitCommit = annotations.getOrDefault("tekton.dev/git-commit",
                labels.getOrDefault("git-commit", null));
        String gitBranch = annotations.getOrDefault("tekton.dev/git-branch",
                labels.getOrDefault("git-branch", null));
        String triggerType = labels.getOrDefault("triggers.tekton.dev/eventlistener", "manual");

        return new PipelineRunSummary(
                meta.getName(),
                meta.getNamespace(),
                pipelineName,
                runStatus,
                reason,
                message,
                startTime,
                completionTime,
                duration,
                buildTaskRunSummariesWithFetch(pr),
                gitCommit,
                gitBranch,
                triggerType
        );
    }

    private List<TaskRunSummary> buildTaskRunSummariesWithFetch(PipelineRun pr) {
        if (pr.getStatus() == null || pr.getStatus().getChildReferences() == null) {
            return Collections.emptyList();
        }
        return pr.getStatus().getChildReferences().stream()
                .map(ref -> {
                    try {
                        TaskRun tr = tektonClient.v1().taskRuns()
                                .inNamespace(pr.getMetadata().getNamespace())
                                .withName(ref.getName())
                                .get();
                        if (tr == null) {
                            return new TaskRunSummary(ref.getName(), ref.getPipelineTaskName(),
                                    "Unknown", null, null, null, null, null, null);
                        }
                        var trStatus = tr.getStatus();
                        String trStatusStr = "Unknown";
                        String trReason = null;
                        Instant trStart = null;
                        Instant trComplete = null;
                        String podName = null;

                        if (trStatus != null) {
                            podName = trStatus.getPodName();
                            var conds = trStatus.getConditions();
                            if (conds != null && !conds.isEmpty()) {
                                var c = conds.get(0);
                                trStatusStr = mapConditionToStatus(c.getStatus(), c.getReason());
                                trReason = c.getReason();
                            }
                            if (trStatus.getStartTime() != null) {
                                trStart = ZonedDateTime.parse(trStatus.getStartTime()).toInstant();
                            }
                            if (trStatus.getCompletionTime() != null) {
                                trComplete = ZonedDateTime.parse(trStatus.getCompletionTime()).toInstant();
                            }
                        }
                        Long trDuration = null;
                        if (trStart != null && trComplete != null) {
                            trDuration = trComplete.getEpochSecond() - trStart.getEpochSecond();
                        }
                        return new TaskRunSummary(ref.getName(), ref.getPipelineTaskName(),
                                trStatusStr, trReason, trStart, trComplete, trDuration, podName, null);
                    } catch (Exception e) {
                        return new TaskRunSummary(ref.getName(), ref.getPipelineTaskName(),
                                "Unknown", null, null, null, null, null, null);
                    }
                })
                .collect(Collectors.toList());
    }

    private List<TaskRunSummary> buildTaskRunSummaries(PipelineRun pr) {
        if (pr.getStatus() == null || pr.getStatus().getChildReferences() == null) {
            return Collections.emptyList();
        }
        // Use only data already present in childReferences — no additional API calls.
        // Fetching each TaskRun individually would cause N×M blocking calls per list request
        // and quickly exhaust the worker thread pool under any load.
        return pr.getStatus().getChildReferences().stream()
                .map(ref -> new TaskRunSummary(
                        ref.getName(),
                        ref.getPipelineTaskName(),
                        "Unknown", null, null, null, null, null, null))
                .collect(Collectors.toList());
    }

    private String resolveStatus(PipelineRun pr) {
        if (pr.getStatus() == null) return PipelineRunSummary.STATUS_PENDING;
        var conditions = pr.getStatus().getConditions();
        if (conditions == null || conditions.isEmpty()) return PipelineRunSummary.STATUS_PENDING;
        var cond = conditions.get(0);
        return mapConditionToStatus(cond.getStatus(), cond.getReason());
    }

    private String mapConditionToStatus(String condStatus, String reason) {
        if ("True".equals(condStatus)) return PipelineRunSummary.STATUS_SUCCEEDED;
        if ("False".equals(condStatus)) {
            if ("Cancelled".equals(reason)) return PipelineRunSummary.STATUS_CANCELLED;
            return PipelineRunSummary.STATUS_FAILED;
        }
        if ("Unknown".equals(condStatus)) {
            if ("Running".equals(reason)) return PipelineRunSummary.STATUS_RUNNING;
            return PipelineRunSummary.STATUS_PENDING;
        }
        return PipelineRunSummary.STATUS_UNKNOWN;
    }
}
