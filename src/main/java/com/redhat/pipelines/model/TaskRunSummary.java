package com.redhat.pipelines.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskRunSummary(
        String name,
        String taskName,
        String status,
        String reason,
        Instant startTime,
        Instant completionTime,
        Long durationSeconds,
        String podName,
        String stepName
) {}
