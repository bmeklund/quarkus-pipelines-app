package com.redhat.pipelines.resource;

import com.redhat.pipelines.model.PipelineRunSummary;
import com.redhat.pipelines.model.TriggerRequest;
import com.redhat.pipelines.service.PipelineRunService;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Blocking
@Path("/api/pipelineruns")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Pipeline Runs", description = "OpenShift Pipelines management")
public class PipelineRunResource {

    @Inject
    PipelineRunService pipelineRunService;

    @GET
    @Path("/ping")
    @Operation(summary = "Ping test")
    public String ping() {
        return "\"pong\"";
    }

    @GET
    @Path("/{namespace}/pipelines")
    @Operation(summary = "List available Pipelines in a namespace")
    public List<String> listPipelines(@PathParam("namespace") String namespace) {
        return pipelineRunService.listPipelines(namespace);
    }

    @GET
    @Path("/{namespace}")
    @Operation(summary = "List all PipelineRuns in a namespace")
    public List<PipelineRunSummary> listPipelineRuns(@PathParam("namespace") String namespace) {
        return pipelineRunService.listPipelineRuns(namespace);
    }

    @GET
    @Path("/{namespace}/{name}")
    @Operation(summary = "Get a specific PipelineRun")
    public Response getPipelineRun(
            @PathParam("namespace") String namespace,
            @PathParam("name") String name) {
        return pipelineRunService.getPipelineRun(namespace, name)
                .map(run -> Response.ok(run).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    @Path("/{namespace}/trigger")
    @Operation(summary = "Trigger a new PipelineRun")
    public Response triggerPipelineRun(
            @PathParam("namespace") String namespace,
            TriggerRequest request) {
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
    @Operation(summary = "Cancel a running PipelineRun")
    public Response cancelPipelineRun(
            @PathParam("namespace") String namespace,
            @PathParam("name") String name) {
        return Response.status(Response.Status.NOT_IMPLEMENTED)
                .entity("{\"message\":\"Cancel not yet implemented\"}")
                .build();
    }
}
