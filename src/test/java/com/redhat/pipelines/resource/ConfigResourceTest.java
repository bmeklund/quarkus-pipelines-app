package com.redhat.pipelines.resource;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class ConfigResourceTest {

    @Test
    void getConfig_returns200WithExpectedKeys() {
        given()
                .when().get("/api/config")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("containsKey('application.name')", is(true))
                .body("containsKey('application.version')", is(true))
                .body("containsKey('http.port')", is(true))
                .body("containsKey('namespace')", is(true))
                .body("containsKey('api-server-url')", is(true))
                .body("containsKey('runtime')", is(true));
    }

    @Test
    void getConfig_runtimeContainsProcessors() {
        given()
                .when().get("/api/config")
                .then()
                .statusCode(200)
                .body("runtime.processors", greaterThanOrEqualTo(1));
    }
}
