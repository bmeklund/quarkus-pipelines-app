package com.redhat.pipelines.health;

import org.eclipse.microprofile.health.HealthCheckResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PipelineMetricsCheckTest {

    @Test
    void call_jvmFallback_returnsUp() {
        PipelineMetricsCheck check = new PipelineMetricsCheck();

        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.UP, response.getStatus());
        assertTrue(response.getData().isPresent());
        assertEquals("jvm", response.getData().get().get("source"));
        assertTrue(response.getData().get().containsKey("used-percent"));
        assertTrue(response.getData().get().containsKey("used-mb"));
    }

    @Test
    void call_responseNameIsMemory() {
        PipelineMetricsCheck check = new PipelineMetricsCheck();

        HealthCheckResponse response = check.call();

        assertEquals("memory", response.getName());
    }
}
