# OpenShift Pipelines Dashboard

A Quarkus-based web application that provides a real-time dashboard for [OpenShift Pipelines (Tekton)](https://docs.openshift.com/pipelines/latest/about/about-pipelines.html). It surfaces pipeline run status, live log streaming, metrics, health, and configuration through a [PatternFly 6](https://www.patternfly.org/) single-page application.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [Quarkus 3.17](https://quarkus.io/) + Java 21 |
| Frontend | React 18 + [PatternFly 6](https://www.patternfly.org/) via [Quinoa](https://docs.quarkiverse.io/quarkus-quinoa/dev/index.html) |
| Build tool | Maven |
| Metrics | Micrometer + Prometheus |
| Tracing | OpenTelemetry (OTLP/gRPC) |
| Health | SmallRye Health (MicroProfile) |
| OpenShift integration | Fabric8 Tekton Client 6.13.4 |
| Container | UBI 9 OpenJDK 21 |

---

## Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+ and npm 10+
- Access to an OpenShift cluster with OpenShift Pipelines installed (or `oc`/`kubectl` configured locally)

---

## Getting Started

### 1. Install frontend dependencies

```bash
cd src/main/webui
npm install
cd ../../..
```

### 2. Run in development mode

Quinoa automatically starts the Vite dev server and proxies `/api` and `/q` to the Quarkus backend.

```bash
mvn quarkus:dev
```

The application is then available at:

| URL | Description |
|---|---|
| http://localhost:8080 | Main dashboard |
| http://localhost:8080/q/swagger-ui | Swagger UI (dev mode only) |
| http://localhost:8080/q/health/ui | Health UI (dev mode only) |
| http://localhost:8080/q/metrics | Prometheus metrics |
| http://localhost:8080/q/dev-ui | Quarkus Dev UI |

> **Note:** In dev mode Quarkus tries to connect to an OpenShift API server. If you are not connected to a cluster the connectivity health check will report `DOWN` but the rest of the UI will still render (pipeline list will return empty).

### 3. Configure watched namespaces

Set which OpenShift namespaces to watch in `src/main/resources/application.properties`:

```properties
app.pipelines.namespaces=default,staging,production
```

Or override at runtime:

```bash
mvn quarkus:dev -Dapp.pipelines.namespaces=default,staging
```

---

## Configuration Reference

All properties live in [src/main/resources/application.properties](src/main/resources/application.properties).

| Property | Default | Description |
|---|---|---|
| `app.pipelines.namespaces` | `default` | Comma-separated list of namespaces to watch |
| `app.pipelines.watch-interval` | `30s` | How often the dashboard polls for updates |
| `app.pipelines.log-tail-lines` | `200` | Number of log lines fetched per pod tail |
| `quarkus.kubernetes-client.trust-certs` | `true` | Trust self-signed certs on the API server |
| `quarkus.kubernetes-client.namespace` | `default` | Default namespace for the K8s client |
| `quarkus.otel.exporter.otlp.endpoint` | `http://localhost:4317` | OTLP collector endpoint |
| `quarkus.otel.enabled` | `true` | Enable/disable OpenTelemetry |

Profile-specific overrides (prefixed `%dev.` or `%prod.`) are already in the properties file.

---

## Building

### Runnable JAR

```bash
mvn package
java -jar target/quarkus-app/quarkus-run.jar
```

### Container image (JVM)

```bash
mvn package
docker build -f src/main/docker/Dockerfile.jvm \
  -t quarkus-pipelines/quarkus-pipelines-app:latest .
```

### Container image (Native)

Requires GraalVM or a container build environment.

```bash
mvn package -Pnative
docker build -f src/main/docker/Dockerfile.native \
  -t quarkus-pipelines/quarkus-pipelines-app:native .
```

### Build and push via Quarkus extension

```bash
mvn package \
  -Dquarkus.container-image.build=true \
  -Dquarkus.container-image.push=true \
  -Dquarkus.container-image.registry=quay.io \
  -Dquarkus.container-image.group=your-org
```

---

## Deploying to OpenShift

### 1. Apply the manifests

The [.openshift/deployment.yaml](.openshift/deployment.yaml) creates:
- A `ServiceAccount` (`pipelines-dashboard`) with a `ClusterRole` granting read access to Tekton CRDs and pod logs across all watched namespaces
- A `Deployment`, `Service`, and edge-terminated `Route`
- A `ConfigMap` (`pipelines-dashboard-config`) for runtime configuration

```bash
# Adjust the namespace and watched namespaces in the ConfigMap first, then:
oc apply -f .openshift/deployment.yaml
```

### 2. Set the container image

Edit the `image:` field in `.openshift/deployment.yaml` to point to your registry, then re-apply, or use:

```bash
oc set image deployment/quarkus-pipelines-app \
  quarkus-pipelines-app=quay.io/your-org/quarkus-pipelines-app:latest
```

### 3. Configure namespaces

```bash
oc create configmap pipelines-dashboard-config \
  --from-literal=namespaces="default,staging,production" \
  --from-literal=otel-endpoint="http://otel-collector:4317" \
  --dry-run=client -o yaml | oc apply -f -
```

### 4. Access the route

```bash
oc get route quarkus-pipelines-app -o jsonpath='{.spec.host}'
```

---

## API Reference

Full interactive documentation is available at `/q/swagger-ui` in dev mode.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/environments` | List configured namespaces with pipeline counts |
| `GET` | `/api/pipelineruns/{namespace}` | List all PipelineRuns in a namespace |
| `GET` | `/api/pipelineruns/{namespace}/{name}` | Get a single PipelineRun |
| `GET` | `/api/pipelineruns/{namespace}/{name}/logs` | **SSE** — stream live logs |
| `POST` | `/api/pipelineruns/{namespace}/trigger` | Trigger a new PipelineRun |
| `GET` | `/api/config` | Application configuration (non-sensitive) |
| `GET` | `/q/health` | All health checks (JSON) |
| `GET` | `/q/health/live` | Liveness probe |
| `GET` | `/q/health/ready` | Readiness probe |
| `GET` | `/q/metrics` | Prometheus metrics |

### Trigger PipelineRun example

```bash
curl -X POST http://localhost:8080/api/pipelineruns/default/trigger \
  -H 'Content-Type: application/json' \
  -d '{
    "pipelineName": "build-and-deploy",
    "gitRevision": "main",
    "gitUrl": "https://github.com/org/repo.git",
    "params": {
      "IMAGE": "quay.io/org/app:latest"
    }
  }'
```

### Live log streaming example

```bash
curl -N http://localhost:8080/api/pipelineruns/default/my-pipeline-run-abc/logs
```

---

## Project Structure

```
src/
├── main/
│   ├── java/com/redhat/pipelines/
│   │   ├── config/
│   │   │   ├── ObservabilityConfig.java      # OTel Tracer producer + JVM metric binders
│   │   │   └── TektonClientProducer.java     # CDI producer for TektonClient
│   │   ├── health/
│   │   │   ├── PipelineConnectivityCheck.java  # @Readiness — verifies K8s API reachability
│   │   │   └── PipelineMetricsCheck.java       # @Liveness  — JVM memory threshold check
│   │   ├── model/                            # Immutable Java records (API DTOs)
│   │   ├── resource/                         # JAX-RS endpoints
│   │   │   ├── PipelineRunResource.java
│   │   │   ├── EnvironmentResource.java
│   │   │   └── ConfigResource.java
│   │   └── service/
│   │       ├── PipelineRunService.java       # Tekton API queries, metrics, tracing
│   │       └── LogStreamingService.java      # Mutiny Multi<String> SSE log tail
│   ├── docker/
│   │   ├── Dockerfile.jvm                    # UBI 9 + OpenJDK 21
│   │   └── Dockerfile.native                 # UBI 9 minimal (native binary)
│   └── resources/
│       └── application.properties
├── main/webui/                               # React SPA (built by Quinoa)
│   ├── src/
│   │   ├── App.jsx                           # Page shell + routing
│   │   ├── api/client.js                     # fetch wrappers + EventSource helper
│   │   ├── components/                       # Reusable PatternFly cards
│   │   └── pages/
│   │       ├── Dashboard.jsx                 # Overview: stats + recent runs + environments
│   │       ├── PipelinesPage.jsx             # Table of all runs + Deploy modal
│   │       ├── LiveLogsPage.jsx              # SSE terminal with auto-scroll + download
│   │       ├── EnvironmentsPage.jsx          # Per-namespace cards
│   │       ├── HealthPage.jsx                # /q/health visualised
│   │       ├── MetricsPage.jsx               # Prometheus metrics — overview + raw
│   │       └── ConfigPage.jsx                # /api/config visualised
│   └── vite.config.js
└── test/
    └── java/com/redhat/pipelines/
        └── PipelineRunResourceTest.java
```

---

## Observability

### Metrics

Prometheus scrapes `/q/metrics`. Key custom metrics:

| Metric | Type | Description |
|---|---|---|
| `pipelines_running` | Gauge | Currently running PipelineRuns per namespace |
| `pipelines_triggered_total` | Counter | PipelineRuns triggered via the dashboard |
| `api_pipelineruns_list_seconds` | Timer | Latency of the list endpoint |
| `api_pipelineruns_trigger_seconds` | Timer | Latency of the trigger endpoint |

Standard JVM, HTTP server, and system metrics are also exported automatically.

### Tracing

Traces are exported via OTLP/gRPC to the endpoint configured in `quarkus.otel.exporter.otlp.endpoint`. Each Tekton API call (`listPipelineRuns`, `getPipelineRun`, `triggerPipelineRun`) creates a child span with relevant attributes (namespace, name).

To send traces to Jaeger locally:

```bash
docker run -p 16686:16686 -p 4317:4317 \
  jaegertracing/all-in-one:latest
```

Then open http://localhost:16686.

---

## Adding a New Namespace / Environment

1. Add the namespace to `app.pipelines.namespaces` in `application.properties` (or the `ConfigMap` in OpenShift).
2. Ensure the `pipelines-dashboard` ServiceAccount has access — the `ClusterRoleBinding` in `.openshift/deployment.yaml` covers all namespaces by default.
3. No code changes required — the backend and UI pick up the new namespace on the next poll.

## Adding a New Health Check

1. Create a class in `src/main/java/com/redhat/pipelines/health/` implementing `org.eclipse.microprofile.health.HealthCheck`.
2. Annotate it with `@Liveness`, `@Readiness`, or `@Startup` and `@ApplicationScoped`.
3. It will appear automatically in `/q/health` and the Health page in the UI.

## Adding a New Metric

Inject `MeterRegistry` and register counters/gauges/timers in your service:

```java
@Inject MeterRegistry meterRegistry;

meterRegistry.counter("my.event", Tags.of("env", namespace)).increment();
```

---

## References

- [Quarkus documentation](https://quarkus.io/guides/)
- [Red Hat build of Quarkus documentation](https://docs.redhat.com/en/documentation/red_hat_build_of_quarkus/)
- [Red Hat Developers — Quarkus](https://developers.redhat.com/products/quarkus/overview)
- [OpenShift Pipelines documentation](https://docs.openshift.com/pipelines/latest/about/about-pipelines.html)
- [PatternFly component library](https://www.patternfly.org/components/all-components/)
- [Quarkus Quinoa extension](https://docs.quarkiverse.io/quarkus-quinoa/dev/index.html)
- [Fabric8 Kubernetes Client](https://github.com/fabric8io/kubernetes-client)
