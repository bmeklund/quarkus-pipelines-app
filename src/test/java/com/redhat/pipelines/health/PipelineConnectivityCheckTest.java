package com.redhat.pipelines.health;

import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.MixedOperation;
import io.fabric8.kubernetes.client.dsl.NonNamespaceOperation;
import io.fabric8.kubernetes.client.dsl.PodResource;
import io.fabric8.kubernetes.api.model.Pod;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PipelineConnectivityCheckTest {

    @Mock
    KubernetesClient kubernetesClient;

    @Mock
    MixedOperation<Pod, PodList, PodResource> podsOp;

    @Mock
    NonNamespaceOperation<Pod, PodList, PodResource> podsInNs;

    @Mock
    PodList podList;

    PipelineConnectivityCheck check;

    @BeforeEach
    void setUp() {
        check = new PipelineConnectivityCheck(kubernetesClient);
        lenient().when(kubernetesClient.pods()).thenReturn(podsOp);
        lenient().when(podsOp.inNamespace(anyString())).thenReturn(podsInNs);
        lenient().when(podsInNs.list()).thenReturn(podList);
    }

    @Test
    void call_whenClientSucceeds_returnsUp() throws Exception {
        when(kubernetesClient.getNamespace()).thenReturn("test-ns");
        when(kubernetesClient.getMasterUrl()).thenReturn(URI.create("https://test-api:6443").toURL());

        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.UP, response.getStatus());
        assertTrue(response.getData().isPresent());
        assertEquals("test-ns", response.getData().get().get("namespace"));
    }

    @Test
    void call_whenClientThrows_returnsDown() {
        when(kubernetesClient.pods()).thenThrow(new RuntimeException("connection refused"));

        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.DOWN, response.getStatus());
        assertTrue(response.getData().isPresent());
        assertTrue(response.getData().get().containsKey("error"));
    }

    @Test
    void call_whenClientThrowsWithCause_returnsDownWithRootCause() {
        RuntimeException withCause = new RuntimeException("outer", new IOException("root cause"));
        when(kubernetesClient.pods()).thenThrow(withCause);

        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.DOWN, response.getStatus());
        assertTrue(response.getData().isPresent());
        assertTrue(response.getData().get().containsKey("error"));
        String error = (String) response.getData().get().get("error");
        assertTrue(error.contains("root cause"));
    }
}
