package com.redhat.pipelines.health;

import io.fabric8.kubernetes.client.KubernetesClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;

@Readiness
@ApplicationScoped
public class PipelineConnectivityCheck implements HealthCheck {

    private final KubernetesClient kubernetesClient;

    @Inject
    public PipelineConnectivityCheck(KubernetesClient kubernetesClient) {
        this.kubernetesClient = kubernetesClient;
    }

    @Override
    public HealthCheckResponse call() {
        try {
            // List pods in our namespace - any authenticated user can do this
            kubernetesClient.pods().inNamespace(kubernetesClient.getNamespace()).list();
            return HealthCheckResponse.named("openshift-connectivity")
                    .up()
                    .withData("namespace", kubernetesClient.getNamespace())
                    .withData("api-url", kubernetesClient.getMasterUrl().toString())
                    .build();
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) root = root.getCause();
            return HealthCheckResponse.named("openshift-connectivity")
                    .down()
                    .withData("error", root.toString())
                    .build();
        }
    }
}
