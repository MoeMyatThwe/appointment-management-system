import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

import java.time.LocalDate;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class PublicBookingIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  void shouldExposePublicBookingCatalogWithoutAuthentication() {
    String tenantId = IntegrationTestSupport.tenantId();

    given()
        .when()
        .get("/public/booking/" + tenantId + "/catalog")
        .then()
        .statusCode(200)
        .body("businessName", notNullValue())
        .body("services", notNullValue())
        .body("staff", notNullValue());
  }

  @Test
  void shouldExposeAvailableBookingDates() {
    String tenantId = IntegrationTestSupport.tenantId();
    String token = IntegrationTestSupport.token();
    String serviceId = given().auth().oauth2(token).when().get("/api/services")
        .then().statusCode(200).extract().jsonPath().getString("[0].id");
    String staffId = given().auth().oauth2(token).when().get("/api/staff")
        .then().statusCode(200).extract().jsonPath().getString("[0].id");

    given()
        .queryParam("serviceId", serviceId)
        .queryParam("staffId", staffId)
        .queryParam("from", LocalDate.now().toString())
        .queryParam("to", LocalDate.now().plusDays(30).toString())
        .queryParam("timezone", "UTC")
        .when()
        .get("/public/booking/" + tenantId + "/available-dates")
        .then()
        .statusCode(200);
  }
}
