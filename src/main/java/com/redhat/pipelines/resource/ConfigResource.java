package com.redhat.pipelines.resource;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.LinkedHashMap;
import java.util.Map;

@ApplicationScoped
@Path("/api/config")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Configuration", description = "Application configuration overview")
public class ConfigResource {

    private final String appName;
    private final String appVersion;
    private final String namespace;
    private final String apiServerUrl;
    private final int httpPort;

    @Inject
    public ConfigResource(
            @ConfigProperty(name = "quarkus.application.name") String appName,
            @ConfigProperty(name = "quarkus.application.version", defaultValue = "unknown") String appVersion,
            @ConfigProperty(name = "quarkus.kubernetes-client.namespace", defaultValue = "default") String namespace,
            @ConfigProperty(name = "quarkus.kubernetes-client.api-server-url", defaultValue = "") String apiServerUrl,
            @ConfigProperty(name = "quarkus.http.port", defaultValue = "8080") int httpPort) {
        this.appName = appName;
        this.appVersion = appVersion;
        this.namespace = namespace;
        this.apiServerUrl = apiServerUrl;
        this.httpPort = httpPort;
    }

    @GET
    @Operation(summary = "Get application configuration (non-sensitive properties)")
    public Map<String, Object> getConfig() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("application.name", appName);
        cfg.put("application.version", appVersion);
        cfg.put("http.port", httpPort);
        cfg.put("namespace", namespace);
        cfg.put("api-server-url", apiServerUrl);
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
