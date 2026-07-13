package com.redhat.pipelines.resource;

import com.redhat.pipelines.model.PipelineRunSummary;
import com.redhat.pipelines.service.PipelineRunService;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static io.restassured.RestAssured.given;
import static org.mockito.Mockito.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.MethodName.class)
class PipelineRunResourceTest {

    private static final String NAMESPACE = "tekton-workshop-user1";

    @InjectMock
    PipelineRunService pipelineRunService;

    // ── ping ─────────────────────────────────────────────────────────────────

    @Test
    void ping_returns200WithPong() {
        given()
                .when().get("/api/pipelineruns/ping")
                .then()
                .statusCode(200)
                .extract().asString().equals("pong");
    }

    // ── listPipelines ────────────────────────────────────────────────────────

    @Test
    void listPipelines_correctNamespace_returns200WithPipelineList() {
        when(pipelineRunService.listPipelines(NAMESPACE)).thenReturn(List.of("pipe-a", "pipe-b"));

        given()
                .when().get("/api/pipelineruns/{ns}/pipelines", NAMESPACE)
                .then()
                .statusCode(200);
    }

    @Test
    void listPipelines_wrongNamespace_returns403() {
        given()
                .when().get("/api/pipelineruns/other-ns/pipelines")
                .then()
                .statusCode(403);
    }

    @Test
    void listPipelines_invalidNamespacePattern_returns400() {
        given()
                .when().get("/api/pipelineruns/-invalid/pipelines")
                .then()
                .statusCode(400);
    }

    // ── listPipelineRuns ─────────────────────────────────────────────────────

    @Test
    void listPipelineRuns_correctNamespace_returns200() {
        when(pipelineRunService.listPipelineRuns(NAMESPACE)).thenReturn(List.of());

        given()
                .when().get("/api/pipelineruns/{ns}", NAMESPACE)
                .then()
                .statusCode(200);
    }

    @Test
    void listPipelineRuns_wrongNamespace_returns403() {
        given()
                .when().get("/api/pipelineruns/other-ns")
                .then()
                .statusCode(403);
    }

    // ── getPipelineRun ───────────────────────────────────────────────────────

    @Test
    void getPipelineRun_found_returns200() {
        when(pipelineRunService.getPipelineRun(NAMESPACE, "my-run"))
                .thenReturn(Optional.of(someSummary()));

        given()
                .when().get("/api/pipelineruns/{ns}/my-run", NAMESPACE)
                .then()
                .statusCode(200);
    }

    @Test
    void getPipelineRun_notFound_returns404() {
        when(pipelineRunService.getPipelineRun(NAMESPACE, "my-run"))
                .thenReturn(Optional.empty());

        given()
                .when().get("/api/pipelineruns/{ns}/my-run", NAMESPACE)
                .then()
                .statusCode(404);
    }

    @Test
    void getPipelineRun_wrongNamespace_returns403() {
        given()
                .when().get("/api/pipelineruns/other-ns/my-run")
                .then()
                .statusCode(403);
    }

    // ── triggerPipelineRun ───────────────────────────────────────────────────

    @Test
    void triggerPipelineRun_valid_returns201() {
        when(pipelineRunService.triggerPipelineRun(any()))
                .thenReturn(Optional.of(someSummary()));

        given()
                .contentType("application/json")
                .body("{\"pipelineName\":\"my-pipe\"}")
                .when().post("/api/pipelineruns/{ns}/trigger", NAMESPACE)
                .then()
                .statusCode(201);
    }

    @Test
    void triggerPipelineRun_missingPipelineName_returns400() {
        given()
                .contentType("application/json")
                .body("{\"pipelineName\":\"\"}")
                .when().post("/api/pipelineruns/{ns}/trigger", NAMESPACE)
                .then()
                .statusCode(400);
    }

    @Test
    void triggerPipelineRun_invalidStorageSize_returns400() {
        given()
                .contentType("application/json")
                .body("{\"pipelineName\":\"p\",\"workspaceStorageSize\":\"notAQuantity\"}")
                .when().post("/api/pipelineruns/{ns}/trigger", NAMESPACE)
                .then()
                .statusCode(400);
    }

    @Test
    void triggerPipelineRun_wrongNamespace_returns403() {
        given()
                .contentType("application/json")
                .body("{\"pipelineName\":\"my-pipe\"}")
                .when().post("/api/pipelineruns/other-ns/trigger")
                .then()
                .statusCode(403);
    }

    @Test
    void triggerPipelineRun_serviceReturnsEmpty_returns500() {
        when(pipelineRunService.triggerPipelineRun(any()))
                .thenReturn(Optional.empty());

        given()
                .contentType("application/json")
                .body("{\"pipelineName\":\"my-pipe\"}")
                .when().post("/api/pipelineruns/{ns}/trigger", NAMESPACE)
                .then()
                .statusCode(500);
    }

    // ── cancelPipelineRun ────────────────────────────────────────────────────

    @Test
    void cancelPipelineRun_returns501() {
        given()
                .when().delete("/api/pipelineruns/{ns}/my-run", NAMESPACE)
                .then()
                .statusCode(501);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private PipelineRunSummary someSummary() {
        return new PipelineRunSummary(
                "my-run", NAMESPACE, "my-pipe", "Running",
                null, null,
                Instant.now(), null, null,
                List.of(),
                null, null, "manual", null, null,
                null, null, null, null, null, null);
    }
}
