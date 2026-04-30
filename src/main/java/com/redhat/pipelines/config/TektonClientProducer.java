package com.redhat.pipelines.config;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.tekton.client.DefaultTektonClient;
import io.fabric8.tekton.client.TektonClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Disposes;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class TektonClientProducer {

    private static final Logger LOG = Logger.getLogger(TektonClientProducer.class);

    private final KubernetesClient kubernetesClient;

    @Inject
    public TektonClientProducer(KubernetesClient kubernetesClient) {
        this.kubernetesClient = kubernetesClient;
    }

    @Produces
    @ApplicationScoped
    TektonClient tektonClient() {
        LOG.infof("Initializing Tekton client against: %s", kubernetesClient.getMasterUrl());
        return new DefaultTektonClient(kubernetesClient);
    }

    void closeTektonClient(@Disposes TektonClient tektonClient) {
        LOG.info("Closing Tekton client");
        tektonClient.close();
    }
}
