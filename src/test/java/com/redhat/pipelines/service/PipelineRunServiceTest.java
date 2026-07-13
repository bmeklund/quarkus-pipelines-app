package com.redhat.pipelines.service;

import com.redhat.pipelines.model.PipelineRunSummary;
import com.redhat.pipelines.model.TriggerRequest;
import io.fabric8.knative.internal.pkg.apis.Condition;
import io.fabric8.kubernetes.client.dsl.MixedOperation;
import io.fabric8.kubernetes.client.dsl.NonNamespaceOperation;
import io.fabric8.kubernetes.client.dsl.Resource;
import io.fabric8.tekton.client.TektonClient;
import io.fabric8.tekton.client.dsl.V1APIGroupDSL;
import io.fabric8.tekton.pipeline.v1.Pipeline;
import io.fabric8.tekton.pipeline.v1.PipelineBuilder;
import io.fabric8.tekton.pipeline.v1.PipelineList;
import io.fabric8.tekton.pipeline.v1.PipelineRun;
import io.fabric8.tekton.pipeline.v1.PipelineRunBuilder;
import io.fabric8.tekton.pipeline.v1.PipelineRunList;
import io.fabric8.tekton.pipeline.v1.PipelineRunStatusBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PipelineRunServiceTest {

    @Mock
    TektonClient tektonClient;

    @Mock
    V1APIGroupDSL v1;

    @Mock
    MixedOperation<Pipeline, PipelineList, Resource<Pipeline>> pipelinesOp;

    @Mock
    NonNamespaceOperation<Pipeline, PipelineList, Resource<Pipeline>> pipelinesInNs;

    @Mock
    PipelineList pipelineList;

    @Mock
    MixedOperation<PipelineRun, PipelineRunList, Resource<PipelineRun>> pipelineRunsOp;

    @Mock
    NonNamespaceOperation<PipelineRun, PipelineRunList, Resource<PipelineRun>> pipelineRunsInNs;

    @Mock
    PipelineRunList pipelineRunList;

    @Mock
    Resource<PipelineRun> pipelineRunResource;

    PipelineRunService service;

    @BeforeEach
    void setUp() {
        service = new PipelineRunService(tektonClient);

        lenient().when(tektonClient.v1()).thenReturn(v1);

        lenient().when(v1.pipelines()).thenReturn(pipelinesOp);
        lenient().when(pipelinesOp.inNamespace(anyString())).thenReturn(pipelinesInNs);
        lenient().when(pipelinesInNs.list()).thenReturn(pipelineList);

        lenient().when(v1.pipelineRuns()).thenReturn(pipelineRunsOp);
        lenient().when(pipelineRunsOp.inNamespace(anyString())).thenReturn(pipelineRunsInNs);
        lenient().when(pipelineRunsInNs.list()).thenReturn(pipelineRunList);
        lenient().when(pipelineRunsInNs.resource(any())).thenReturn(pipelineRunResource);
    }

    // ── listPipelines ────────────────────────────────────────────────────────

    @Test
    void listPipelines_returnsSortedAlphabetically() {
        Pipeline pipelineB = new PipelineBuilder()
                .withNewMetadata().withName("pipeline-b").endMetadata()
                .build();
        Pipeline pipelineA = new PipelineBuilder()
                .withNewMetadata().withName("pipeline-a").endMetadata()
                .build();
        when(pipelineList.getItems()).thenReturn(List.of(pipelineB, pipelineA));

        List<String> result = service.listPipelines("ns");

        assertEquals(List.of("pipeline-a", "pipeline-b"), result);
    }

    @Test
    void listPipelines_returnsEmptyListWhenClientThrows() {
        when(tektonClient.v1()).thenThrow(new RuntimeException("connection refused"));

        List<String> result = service.listPipelines("ns");

        assertTrue(result.isEmpty());
    }

    // ── listPipelineRuns ─────────────────────────────────────────────────────

    @Test
    void listPipelineRuns_returnsSortedByStartTimeDescending() {
        Instant oldest = Instant.parse("2024-01-01T10:00:00Z");
        Instant middle = Instant.parse("2024-06-15T12:00:00Z");
        Instant newest = Instant.parse("2024-12-31T23:00:00Z");

        PipelineRun run1 = buildRunWithStartTime("run-oldest", oldest);
        PipelineRun run2 = buildRunWithStartTime("run-newest", newest);
        PipelineRun run3 = buildRunWithStartTime("run-middle", middle);

        when(pipelineRunList.getItems()).thenReturn(List.of(run1, run2, run3));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(3, result.size());
        assertEquals("run-newest", result.get(0).name());
        assertEquals("run-middle", result.get(1).name());
        assertEquals("run-oldest", result.get(2).name());
    }

    @Test
    void listPipelineRuns_returnsEmptyListWhenClientThrows() {
        when(tektonClient.v1()).thenThrow(new RuntimeException("unavailable"));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertTrue(result.isEmpty());
    }

    // ── getPipelineRun ───────────────────────────────────────────────────────

    @Test
    void getPipelineRun_returnsPopulatedOptionalWhenRunExists() {
        PipelineRun run = buildRunWithStartTime("my-run", Instant.parse("2024-06-01T10:00:00Z"));
        when(pipelineRunsInNs.withName("my-run")).thenReturn(pipelineRunResource);
        when(pipelineRunResource.get()).thenReturn(run);

        Optional<PipelineRunSummary> result = service.getPipelineRun("ns", "my-run");

        assertTrue(result.isPresent());
        assertEquals("my-run", result.get().name());
    }

    @Test
    void getPipelineRun_returnsEmptyOptionalWhenGetReturnsNull() {
        when(pipelineRunsInNs.withName("missing")).thenReturn(pipelineRunResource);
        when(pipelineRunResource.get()).thenReturn(null);

        Optional<PipelineRunSummary> result = service.getPipelineRun("ns", "missing");

        assertTrue(result.isEmpty());
    }

    @Test
    void getPipelineRun_returnsEmptyOptionalWhenClientThrows() {
        when(tektonClient.v1()).thenThrow(new RuntimeException("network error"));

        Optional<PipelineRunSummary> result = service.getPipelineRun("ns", "my-run");

        assertTrue(result.isEmpty());
    }

    // ── triggerPipelineRun ───────────────────────────────────────────────────

    @Test
    void triggerPipelineRun_success_returnsOptionalWithMatchingName() {
        PipelineRun created = new PipelineRunBuilder()
                .withNewMetadata()
                    .withName("my-pipeline-run-abc")
                    .withNamespace("ns")
                .endMetadata()
                .build();
        when(pipelineRunResource.create()).thenReturn(created);

        TriggerRequest request = new TriggerRequest("my-pipeline", "ns", null, null, null);
        Optional<PipelineRunSummary> result = service.triggerPipelineRun(request);

        assertTrue(result.isPresent());
        assertEquals("my-pipeline-run-abc", result.get().name());
    }

    @Test
    void triggerPipelineRun_withWorkspace_returnsOptionalPresent() {
        PipelineRun created = new PipelineRunBuilder()
                .withNewMetadata()
                    .withName("my-pipeline-run-xyz")
                    .withNamespace("ns")
                .endMetadata()
                .build();
        when(pipelineRunResource.create()).thenReturn(created);

        TriggerRequest request = new TriggerRequest("my-pipeline", "ns", null, "ws", "2Gi");
        Optional<PipelineRunSummary> result = service.triggerPipelineRun(request);

        assertTrue(result.isPresent());
    }

    @Test
    void triggerPipelineRun_nullWorkspaceStorageSizeDefaultsTo1Gi_returnsOptionalPresent() {
        PipelineRun created = new PipelineRunBuilder()
                .withNewMetadata()
                    .withName("my-pipeline-run-def")
                    .withNamespace("ns")
                .endMetadata()
                .build();
        when(pipelineRunResource.create()).thenReturn(created);

        TriggerRequest request = new TriggerRequest("my-pipeline", "ns", null, "ws", null);
        Optional<PipelineRunSummary> result = service.triggerPipelineRun(request);

        assertTrue(result.isPresent());
    }

    @Test
    void triggerPipelineRun_returnsEmptyOptionalWhenCreateReturnsNull() {
        when(pipelineRunResource.create()).thenReturn(null);

        TriggerRequest request = new TriggerRequest("my-pipeline", "ns", null, null, null);
        Optional<PipelineRunSummary> result = service.triggerPipelineRun(request);

        assertTrue(result.isEmpty());
    }

    @Test
    void triggerPipelineRun_returnsEmptyOptionalWhenClientThrows() {
        when(tektonClient.v1()).thenThrow(new RuntimeException("forbidden"));

        TriggerRequest request = new TriggerRequest("my-pipeline", "ns", null, null, null);
        Optional<PipelineRunSummary> result = service.triggerPipelineRun(request);

        assertTrue(result.isEmpty());
    }

    // ── Status mapping (verified via listPipelineRuns) ───────────────────────

    @Test
    void listPipelineRuns_conditionStatusTrue_mapsToSucceeded() {
        when(pipelineRunList.getItems()).thenReturn(List.of(buildRunWithCondition("run-1", "True", null)));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(PipelineRunSummary.STATUS_SUCCEEDED, result.get(0).status());
    }

    @Test
    void listPipelineRuns_conditionStatusFalseReasonCancelled_mapsToCancelled() {
        when(pipelineRunList.getItems()).thenReturn(List.of(buildRunWithCondition("run-1", "False", "Cancelled")));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(PipelineRunSummary.STATUS_CANCELLED, result.get(0).status());
    }

    @Test
    void listPipelineRuns_conditionStatusFalseReasonFailed_mapsToFailed() {
        when(pipelineRunList.getItems()).thenReturn(List.of(buildRunWithCondition("run-1", "False", "Failed")));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(PipelineRunSummary.STATUS_FAILED, result.get(0).status());
    }

    @Test
    void listPipelineRuns_conditionStatusUnknownReasonRunning_mapsToRunning() {
        when(pipelineRunList.getItems()).thenReturn(List.of(buildRunWithCondition("run-1", "Unknown", "Running")));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(PipelineRunSummary.STATUS_RUNNING, result.get(0).status());
    }

    @Test
    void listPipelineRuns_conditionStatusUnknownReasonPipelineRunPending_mapsToPending() {
        when(pipelineRunList.getItems()).thenReturn(List.of(buildRunWithCondition("run-1", "Unknown", "PipelineRunPending")));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(PipelineRunSummary.STATUS_PENDING, result.get(0).status());
    }

    @Test
    void listPipelineRuns_noStatusOrConditions_mapsToPending() {
        PipelineRun run = new PipelineRunBuilder()
                .withNewMetadata()
                    .withName("run-1")
                    .withNamespace("ns")
                .endMetadata()
                .build();
        when(pipelineRunList.getItems()).thenReturn(List.of(run));

        List<PipelineRunSummary> result = service.listPipelineRuns("ns");

        assertEquals(PipelineRunSummary.STATUS_PENDING, result.get(0).status());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private PipelineRun buildRunWithStartTime(String name, Instant startTime) {
        return new PipelineRunBuilder()
                .withNewMetadata()
                    .withName(name)
                    .withNamespace("ns")
                .endMetadata()
                .withStatus(new PipelineRunStatusBuilder()
                        .withStartTime(startTime.toString())
                        .build())
                .build();
    }

    private PipelineRun buildRunWithCondition(String name, String condStatus, String reason) {
        Condition cond = new Condition();
        cond.setType("Succeeded");
        cond.setStatus(condStatus);
        cond.setReason(reason);
        cond.setMessage("msg");

        return new PipelineRunBuilder()
                .withNewMetadata()
                    .withName(name)
                    .withNamespace("ns")
                .endMetadata()
                .withStatus(new PipelineRunStatusBuilder()
                        .withConditions(List.of(cond))
                        .withStartTime(Instant.parse("2024-06-01T10:00:00Z").toString())
                        .build())
                .build();
    }
}
