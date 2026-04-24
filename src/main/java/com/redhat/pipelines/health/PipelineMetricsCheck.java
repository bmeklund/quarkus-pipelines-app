package com.redhat.pipelines.health;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.HealthCheckResponseBuilder;
import org.eclipse.microprofile.health.Readiness;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Readiness
@ApplicationScoped
public class PipelineMetricsCheck implements HealthCheck {

    // cgroup v2
    private static final Path CGROUP_V2_USAGE = Path.of("/sys/fs/cgroup/memory.current");
    private static final Path CGROUP_V2_LIMIT = Path.of("/sys/fs/cgroup/memory.max");
    // cgroup v1
    private static final Path CGROUP_V1_USAGE = Path.of("/sys/fs/cgroup/memory/memory.usage_in_bytes");
    private static final Path CGROUP_V1_LIMIT = Path.of("/sys/fs/cgroup/memory/memory.limit_in_bytes");

    @Override
    public HealthCheckResponse call() {
        if (Files.exists(CGROUP_V2_USAGE)) {
            return buildFromCgroup(CGROUP_V2_USAGE, CGROUP_V2_LIMIT, "cgroup-v2");
        } else if (Files.exists(CGROUP_V1_USAGE)) {
            return buildFromCgroup(CGROUP_V1_USAGE, CGROUP_V1_LIMIT, "cgroup-v1");
        } else {
            return buildFromJvm();
        }
    }

    private HealthCheckResponse buildFromCgroup(Path usagePath, Path limitPath, String source) {
        try {
            long usageBytes = Long.parseLong(Files.readString(usagePath).trim());
            String limitRaw = Files.readString(limitPath).trim();
            // "max" means no limit set — fall back to JVM max
            long limitBytes = "max".equals(limitRaw)
                    ? Runtime.getRuntime().maxMemory()
                    : Long.parseLong(limitRaw);

            long usedMb = usageBytes / 1024 / 1024;
            long limitMb = limitBytes / 1024 / 1024;
            double usedPercent = (double) usageBytes / limitBytes * 100;

            HealthCheckResponseBuilder builder = HealthCheckResponse.named("memory")
                    .withData("source", source)
                    .withData("used-mb", usedMb)
                    .withData("limit-mb", limitMb)
                    .withData("used-percent", String.format("%.1f", usedPercent));

            return (usedPercent > 95 ? builder.down() : builder.up()).build();
        } catch (IOException | NumberFormatException e) {
            return buildFromJvm();
        }
    }

    private HealthCheckResponse buildFromJvm() {
        long usedMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
        long maxMemory = Runtime.getRuntime().maxMemory();
        double memoryUsedPercent = (double) usedMemory / maxMemory * 100;

        HealthCheckResponseBuilder builder = HealthCheckResponse.named("memory")
                .withData("source", "jvm")
                .withData("used-mb", usedMemory / 1024 / 1024)
                .withData("max-mb", maxMemory / 1024 / 1024)
                .withData("used-percent", String.format("%.1f", memoryUsedPercent));

        return (memoryUsedPercent > 95 ? builder.down() : builder.up()).build();
    }
}
