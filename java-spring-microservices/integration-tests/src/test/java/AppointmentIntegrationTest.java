import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.not;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class AppointmentIntegrationTest {
  @BeforeAll
  static void setUp() {
    RestAssured.baseURI = System.getenv().getOrDefault(
        "TEST_BASE_URL", "http://localhost:4004");
  }

  @Test
  public void shouldReturnAppointmentsWithValidToken() {
    String token = given()
        .contentType("application/json")
        .body("""
            {
              "email": "testuser@test.com",
              "password": "password123"
            }
            """)
        .when()
        .post("/auth/login")
        .then()
        .statusCode(200)
        .extract()
        .jsonPath()
        .getString("token");

    given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/api/appointments")
        .then()
        .statusCode(200)
        .body("$", not(empty()));
  }
}
