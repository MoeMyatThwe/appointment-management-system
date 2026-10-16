import static io.restassured.RestAssured.given;

import io.restassured.RestAssured;
import io.restassured.response.Response;

final class IntegrationTestSupport {
  private IntegrationTestSupport() {}

  static void configure() {
    RestAssured.baseURI = System.getenv().getOrDefault(
        "TEST_BASE_URL", "http://localhost:4004");
  }

  static Response login() {
    return given()
        .contentType("application/json")
        .body("""
            {
              "email": "demo.owner@example.com",
              "password": "password123"
            }
            """)
        .when()
        .post("/auth/login")
        .then()
        .statusCode(200)
        .extract()
        .response();
  }

  static String token() {
    return login().jsonPath().getString("accessToken");
  }

  static String tenantId() {
    return login().jsonPath().getString("tenantId");
  }

  static io.restassured.response.Response customerLogin() {
    return given()
        .contentType("application/json")
        .body("""
            {
              "email": "demo.customer@example.com",
              "password": "password123"
            }
            """)
        .when()
        .post("/auth/customer/login")
        .then()
        .statusCode(200)
        .extract()
        .response();
  }
}
