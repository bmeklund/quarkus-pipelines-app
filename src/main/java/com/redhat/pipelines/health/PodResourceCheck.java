package com.redhat.pipelines.health;

import io.fabric8.kubernetes.client.KubernetesClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.HealthCheckResponseBuilder;
import org.eclipse.microprofile.health.Readiness;

@Readiness
@ApplicationScoped
public class PodResourceCheck implements HealthCheck {

    @Inject
    KubernetesClient kubernetesClient;

    @Override
    public HealthCheckResponse call() {
        // POD_NAME is injected via the Downward API in the Deployment; HOSTNAME is the pod name in Kubernetes
        String podName = System.getenv("POD_NAME");
        if (podName == null || podName.isBlank()) {
            podName = System.getenv("HOSTNAME");
        }
        String namespace = kubernetesClient.getNamespace();

        HealthCheckResponseBuilder builder = HealthCheckResponse.named("pod-resources");

        if (podName == null || podName.isBlank()) {
            return builder.up().withData("note", "not running in Kubernetes").build();
        }

        try {
            var pod = kubernetesClient.pods().inNamespace(namespace).withName(podName).get();
            if (pod == null) {
                return builder.up().withData("note", "pod not found").build();
            }

            builder.withData("pod", podName).withData("namespace", namespace);

            var containers = pod.getSpec().getContainers();
            if (containers != null) {
                for (var container : containers) {
                    var resources = container.getResources();
                    if (resources == null) continue;
                    String prefix = containers.size() > 1 ? container.getName() + "." : "";
                    if (resources.getRequests() != null) {
                        var req = resources.getRequests();
                        if (req.containsKey("memory")) builder.withData(prefix + "memory-request", req.get("memory").toString());
                        if (req.containsKey("cpu"))    builder.withData(prefix + "cpu-request",    req.get("cpu").toString());
                    }
                    if (resources.getLimits() != null) {
                        var lim = resources.getLimits();
                        if (lim.containsKey("memory")) builder.withData(prefix + "memory-limit", lim.get("memory").toString());
                        if (lim.containsKey("cpu"))    builder.withData(prefix + "cpu-limit",    lim.get("cpu").toString());
                    }
                }
            }

            return builder.up().build();
        } catch (Exception e) {
            return builder.up().withData("note", "could not read pod spec: " + e.getMessage()).build();
        }
    }
}
