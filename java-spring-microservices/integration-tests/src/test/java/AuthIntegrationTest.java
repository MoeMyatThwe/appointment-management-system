import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class AuthIntegrationTest {

  @BeforeAll
  static void setUp(){
    RestAssured.baseURI = System.getenv().getOrDefault(
        "TEST_BASE_URL", "http://localhost:4004");
  }

  @Test
  public void shouldReturnOKWithValidToken() {
    given()
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
        .body("accessToken", notNullValue())
        .body("tenantId", notNullValue());
  }

  @Test
  public void shouldReturnUnauthorizedOnInvalidLogin() {
    String loginPayload = """
          {
            "email": "invalid_user@test.com",
            "password": "wrongpassword"
          }
        """;

    given()
        .contentType("application/json")
        .body(loginPayload)
        .when()
        .post("/auth/login")
        .then()
        .statusCode(401);
  }

  @Test
  public void shouldRejectProtectedEndpointWithoutToken() {
    given()
        .when()
        .get("/api/appointments")
        .then()
        .statusCode(401);
  }

  @Test
  public void shouldRefreshAndRevokeBusinessSession() {
    String refreshToken = IntegrationTestSupport.login()
        .jsonPath().getString("refreshToken");

    String replacementRefreshToken = given()
        .contentType("application/json")
        .body("{\"refreshToken\":\"" + refreshToken + "\"}")
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(200)
        .body("accessToken", notNullValue())
        .body("refreshToken", notNullValue())
        .extract()
        .jsonPath()
        .getString("refreshToken");

    given()
        .contentType("application/json")
        .body("{\"refreshToken\":\"" + replacementRefreshToken + "\"}")
        .when()
        .post("/auth/logout")
        .then()
        .statusCode(204);

    given()
        .contentType("application/json")
        .body("{\"refreshToken\":\"" + replacementRefreshToken + "\"}")
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(401);
  }

  @Test
  public void shouldRejectMalformedBusinessCredentials() {
    given()
        .contentType("application/json")
        .body("""
            {
              "email": "not-an-email",
              "password": "short"
            }
            """)
        .when()
        .post("/auth/login")
        .then()
        .statusCode(401);
  }

  @Test
  public void shouldPreventCustomerTokenFromBusinessWorkspaceEndpoint() {
    String customerToken = IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken");

    given()
        .auth().oauth2(customerToken)
        .when()
        .get("/api/appointments")
        .then()
        .statusCode(403);
  }
}
