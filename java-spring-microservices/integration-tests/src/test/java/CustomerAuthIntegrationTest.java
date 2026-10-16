import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class CustomerAuthIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  void shouldRegisterAndAuthenticateCustomer() {
    String email = "customer-" + UUID.randomUUID() + "@test.com";
    String password = "password123";

    String token = given()
        .contentType("application/json")
        .body("""
            {
              "email": "%s",
              "password": "%s"
            }
            """.formatted(email, password))
        .when()
        .post("/auth/customer/register")
        .then()
        .statusCode(200)
        .body("accessToken", notNullValue())
        .body("tenantId", equalTo(""))
        .extract()
        .jsonPath()
        .getString("accessToken");

    given()
        .auth().oauth2(token)
        .when()
        .get("/auth/me")
        .then()
        .statusCode(200)
        .body("email", equalTo(email))
        .body("role", equalTo("CUSTOMER"))
        .body("tenantId", equalTo(""));
  }

  @Test
  void shouldRejectCustomerPortalWithoutAuthentication() {
    given()
        .when()
        .get("/api/customer/appointments")
        .then()
        .statusCode(401);
  }

  @Test
  void shouldLoginSharedDemoCustomerWithCustomerRole() {
    String token = IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken");

    given()
        .auth().oauth2(token)
        .when()
        .get("/auth/me")
        .then()
        .statusCode(200)
        .body("role", equalTo("CUSTOMER"))
        .body("tenantId", equalTo(""));
  }

  @Test
  void shouldRejectCustomerUsingBusinessLoginEndpoint() {
    given()
        .contentType("application/json")
        .body("""
            {
              "email": "demo.customer@example.com",
              "password": "password123"
            }
            """)
        .when()
        .post("/auth/login")
        .then()
        .statusCode(401);
  }

  @Test
  void shouldRejectInvalidCustomerCredentials() {
    given()
        .contentType("application/json")
        .body("""
            {
              "email": "demo.customer@example.com",
              "password": "wrong-password"
            }
            """)
        .when()
        .post("/auth/customer/login")
        .then()
        .statusCode(401);
  }
}
