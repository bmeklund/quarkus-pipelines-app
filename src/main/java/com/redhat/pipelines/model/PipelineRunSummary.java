package com.redhat.pipelines.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PipelineRunSummary(
        String name,
        String namespace,
        String pipelineName,
        String status,
        String reason,
        String message,
        Instant startTime,
        Instant completionTime,
        Long durationSeconds,
        List<TaskRunSummary> taskRuns,
        String gitCommit,
        String gitBranch,
        String triggerType,
        String triggerName,
        String startedBy,
        String pacSender,
        String pacEventType,
        String pacRepository,
        String pacShaTitle
) {

    public static final String STATUS_RUNNING = "Running";
    public static final String STATUS_SUCCEEDED = "Succeeded";
    public static final String STATUS_FAILED = "Failed";
    public static final String STATUS_CANCELLED = "Cancelled";
    public static final String STATUS_PENDING = "Pending";
    public static final String STATUS_UNKNOWN = "Unknown";
}
