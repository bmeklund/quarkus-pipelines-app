package com.redhat.pipelines.config;

import io.fabric8.kubernetes.client.Config;
import io.fabric8.kubernetes.client.ConfigBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.tekton.client.TektonClient;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TektonClientProducerTest {

    @Test
    void tektonClient_returnsNonNull() {
        Config config = new ConfigBuilder()
                .withMasterUrl("https://localhost:6443")
                .withTrustCerts(true)
                .build();
        KubernetesClient k8s = new KubernetesClientBuilder().withConfig(config).build();
        TektonClientProducer producer = new TektonClientProducer(k8s);

        TektonClient tc = producer.tektonClient();

        assertNotNull(tc);
        tc.close();
        k8s.close();
    }

    @Test
    void closeTektonClient_closesClient() {
        KubernetesClient k8sMock = mock(KubernetesClient.class);
        TektonClientProducer producer = new TektonClientProducer(k8sMock);
        TektonClient tcMock = mock(TektonClient.class);

        producer.closeTektonClient(tcMock);

        verify(tcMock).close();
    }
}
