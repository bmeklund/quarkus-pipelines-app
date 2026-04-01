package com.redhat.pipelines.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TriggerRequest(
        String pipelineName,
        String namespace,
        Map<String, String> params,
        String workspaceName,
        String workspaceStorageSize
) {}
