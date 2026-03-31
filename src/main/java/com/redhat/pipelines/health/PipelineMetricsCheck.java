package com.redhat.pipelines.health;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Liveness;

@Liveness
@ApplicationScoped
public class PipelineMetricsCheck implements HealthCheck {

    @Override
    public HealthCheckResponse call() {
        long usedMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
        long maxMemory = Runtime.getRuntime().maxMemory();
        double memoryUsedPercent = (double) usedMemory / maxMemory * 100;

        if (memoryUsedPercent > 95) {
            return HealthCheckResponse.named("memory")
                    .down()
                    .withData("used-mb", usedMemory / 1024 / 1024)
                    .withData("max-mb", maxMemory / 1024 / 1024)
                    .withData("used-percent", String.format("%.1f", memoryUsedPercent))
                    .build();
        }

        return HealthCheckResponse.named("memory")
                .up()
                .withData("used-mb", usedMemory / 1024 / 1024)
                .withData("max-mb", maxMemory / 1024 / 1024)
                .withData("used-percent", String.format("%.1f", memoryUsedPercent))
                .build();
    }
}
