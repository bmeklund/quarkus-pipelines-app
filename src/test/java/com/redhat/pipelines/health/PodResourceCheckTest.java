package com.redhat.pipelines.health;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.MixedOperation;
import io.fabric8.kubernetes.client.dsl.NonNamespaceOperation;
import io.fabric8.kubernetes.client.dsl.PodResource;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PodResourceCheckTest {

    @Mock
    KubernetesClient kubernetesClient;

    @Mock
    MixedOperation<Pod, PodList, PodResource> podsOp;

    @Mock
    NonNamespaceOperation<Pod, PodList, PodResource> podsInNs;

    @Mock
    PodResource podResource;

    PodResourceCheck check;

    @BeforeEach
    void setUp() {
        check = new PodResourceCheck(kubernetesClient);
        lenient().when(kubernetesClient.getNamespace()).thenReturn("test-ns");
        lenient().when(kubernetesClient.pods()).thenReturn(podsOp);
        lenient().when(podsOp.inNamespace(anyString())).thenReturn(podsInNs);
        lenient().when(podsInNs.withName(anyString())).thenReturn(podResource);
        lenient().when(podResource.get()).thenReturn(null);
    }

    @Test
    void call_noPodNameEnvVar_returnsUpWithNote() {
        // POD_NAME is not set in the test environment. The check falls back to HOSTNAME.
        // If HOSTNAME resolves (dev machine name), Kubernetes returns null for that pod name,
        // so the check returns UP + "pod not found". If HOSTNAME is also absent it returns
        // UP + "not running in Kubernetes". Either way the status must be UP.
        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.UP, response.getStatus());
    }

    @Test
    void call_podNotFound_returnsUpWithNote() {
        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.UP, response.getStatus());
    }

    @Test
    void call_clientThrows_returnsUpWithNote() {
        lenient().when(kubernetesClient.pods()).thenThrow(new RuntimeException("forbidden"));

        HealthCheckResponse response = check.call();

        assertEquals(HealthCheckResponse.Status.UP, response.getStatus());
        assertTrue(response.getData().isPresent());
    }
}
