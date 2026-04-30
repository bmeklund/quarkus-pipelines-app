package com.redhat.pipelines.resource;

import com.redhat.pipelines.model.PipelineRunSummary;
import com.redhat.pipelines.model.TriggerRequest;
import com.redhat.pipelines.service.PipelineRunService;
import io.smallrye.common.annotation.Blocking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@ApplicationScoped
@Blocking
@Path("/api/pipelineruns")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Pipeline Runs", description = "OpenShift Pipelines management")
public class PipelineRunResource {

    // Kubernetes DNS label: lowercase alphanumeric and hyphens, must start with alphanumeric
    private static final String NS_PATTERN = "[a-z0-9][-a-z0-9]*";
    // Kubernetes name: like DNS label but also allows dots (e.g. for generated names)
    private static final String NAME_PATTERN = "[a-z0-9][-a-z0-9.]*";
    // Kubernetes Quantity for storage: digits optionally followed by a binary/decimal SI suffix
    private static final String QUANTITY_PATTERN = "\\d+([KMGTPE]i?)?";

    private final PipelineRunService pipelineRunService;
    private final String configuredNamespace;

    @Inject
    public PipelineRunResource(
            PipelineRunService pipelineRunService,
            @ConfigProperty(name = "quarkus.kubernetes-client.namespace", defaultValue = "default") String configuredNamespace) {
        this.pipelineRunService = pipelineRunService;
        this.configuredNamespace = configuredNamespace;
    }

    private Response namespaceNotAllowed() {
        return Response.status(Response.Status.FORBIDDEN)
                .entity("{\"error\":\"namespace not allowed\"}")
                .build();
    }

    @GET
    @Path("/ping")
    @Operation(summary = "Ping test")
    public String ping() {
        return "pong";
    }

    @GET
    @Path("/{namespace}/pipelines")
    @Operation(summary = "List available Pipelines in a namespace")
    public Response listPipelines(
            @PathParam("namespace") @Pattern(regexp = NS_PATTERN) @Size(max = 63) String namespace) {
        if (!configuredNamespace.equals(namespace)) return namespaceNotAllowed();
        List<String> result = pipelineRunService.listPipelines(namespace);
        return Response.ok(result).build();
    }

    @GET
    @Path("/{namespace}")
    @Operation(summary = "List all PipelineRuns in a namespace")
    public Response listPipelineRuns(
            @PathParam("namespace") @Pattern(regexp = NS_PATTERN) @Size(max = 63) String namespace) {
        if (!configuredNamespace.equals(namespace)) return namespaceNotAllowed();
        List<PipelineRunSummary> result = pipelineRunService.listPipelineRuns(namespace);
        return Response.ok(result).build();
    }

    @GET
    @Path("/{namespace}/{name}")
    @Operation(summary = "Get a specific PipelineRun")
    public Response getPipelineRun(
            @PathParam("namespace") @Pattern(regexp = NS_PATTERN) @Size(max = 63) String namespace,
            @PathParam("name") @Pattern(regexp = NAME_PATTERN) @Size(max = 253) String name) {
        if (!configuredNamespace.equals(namespace)) return namespaceNotAllowed();
        return pipelineRunService.getPipelineRun(namespace, name)
                .map(run -> Response.ok(run).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    @Path("/{namespace}/trigger")
    @Operation(summary = "Trigger a new PipelineRun")
    public Response triggerPipelineRun(
            @PathParam("namespace") @Pattern(regexp = NS_PATTERN) @Size(max = 63) String namespace,
            TriggerRequest request) {
        if (!configuredNamespace.equals(namespace)) return namespaceNotAllowed();
        if (request.pipelineName() == null || request.pipelineName().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"pipelineName is required\"}")
                    .build();
        }
        if (request.workspaceStorageSize() != null
                && !request.workspaceStorageSize().isBlank()
                && !request.workspaceStorageSize().matches(QUANTITY_PATTERN)) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"invalid workspaceStorageSize; expected a Kubernetes Quantity such as 1Gi or 500Mi\"}")
                    .build();
        }
        var effectiveRequest = new TriggerRequest(
                request.pipelineName(),
                namespace,
                request.params(),
                request.workspaceName(),
                request.workspaceStorageSize());
        return pipelineRunService.triggerPipelineRun(effectiveRequest)
                .map(run -> Response.status(Response.Status.CREATED).entity(run).build())
                .orElse(Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("{\"error\":\"Failed to trigger pipeline run\"}").build());
    }

    @DELETE
    @Path("/{namespace}/{name}")
    @Operation(summary = "Cancel a running PipelineRun (not yet implemented)")
    public Response cancelPipelineRun(
            @PathParam("namespace") @Pattern(regexp = NS_PATTERN) @Size(max = 63) String namespace,
            @PathParam("name") @Pattern(regexp = NAME_PATTERN) @Size(max = 253) String name) {
        return Response.status(Response.Status.NOT_IMPLEMENTED)
                .entity("{\"message\":\"Cancel not yet implemented\"}")
                .build();
    }
}
