package com.redhat.pipelines.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.LinkedHashMap;
import java.util.Map;

@Path("/api/config")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Configuration", description = "Application configuration overview")
public class ConfigResource {

    @ConfigProperty(name = "quarkus.application.name")
    String appName;

    @ConfigProperty(name = "quarkus.application.version", defaultValue = "unknown")
    String appVersion;

    @ConfigProperty(name = "quarkus.kubernetes-client.namespace", defaultValue = "default")
    String namespace;

    @ConfigProperty(name = "quarkus.http.port", defaultValue = "8080")
    int httpPort;

    @GET
    @Operation(summary = "Get application configuration (non-sensitive properties)")
    public Map<String, Object> getConfig() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("application.name", appName);
        cfg.put("application.version", appVersion);
        cfg.put("http.port", httpPort);
        cfg.put("namespace", namespace);
        cfg.put("runtime", Map.of(
                "java.version", System.getProperty("java.version", "unknown"),
                "java.vendor", System.getProperty("java.vendor", "unknown"),
                "os.name", System.getProperty("os.name", "unknown"),
                "processors", Runtime.getRuntime().availableProcessors(),
                "max-memory-mb", Runtime.getRuntime().maxMemory() / 1024 / 1024
        ));
        return cfg;
    }
}
