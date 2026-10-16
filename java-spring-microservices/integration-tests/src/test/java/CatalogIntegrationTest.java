import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class CatalogIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  void shouldLoadCatalogCollections() {
    String token = IntegrationTestSupport.token();

    given().auth().oauth2(token).when().get("/api/customers").then().statusCode(200);
    given().auth().oauth2(token).when().get("/api/staff").then().statusCode(200);
    given().auth().oauth2(token).when().get("/api/services").then().statusCode(200);
    given().auth().oauth2(token).when().get("/api/resources").then().statusCode(200);
  }

  @Test
  void shouldLoadSchedulingSettings() {
    String token = IntegrationTestSupport.token();

    given().auth().oauth2(token).when().get("/api/settings/business-hours")
        .then().statusCode(200);
    given().auth().oauth2(token).when().get("/api/settings/holidays")
        .then().statusCode(200);
  }

  @Test
  void shouldReturnWorkspaceProfile() {
    given().auth().oauth2(IntegrationTestSupport.token())
        .when().get("/auth/workspace")
        .then().statusCode(200)
        .body("timezone", notNullValue());
  }

  @Test
  void shouldSupportCatalogPaginationAndFilters() {
    String token = IntegrationTestSupport.token();

    given().auth().oauth2(token)
        .queryParam("page", 0)
        .queryParam("size", 1)
        .queryParam("sortBy", "name")
        .queryParam("direction", "asc")
        .when().get("/api/services")
        .then().statusCode(200)
        .body("content.size()", greaterThanOrEqualTo(0))
        .body("totalElements", greaterThanOrEqualTo(0));

    given().auth().oauth2(token)
        .queryParam("query", "massage")
        .when().get("/api/services")
        .then().statusCode(200);

    given().auth().oauth2(token)
        .queryParam("page", 0)
        .queryParam("size", 1)
        .queryParam("sortBy", "name")
        .queryParam("direction", "asc")
        .when().get("/api/staff")
        .then().statusCode(200)
        .body("content.size()", greaterThanOrEqualTo(0));
  }

  @Test
  void shouldCreateHolidayAndStaffTimeOffForManager() {
    String token = IntegrationTestSupport.token();
    String staffId = given().auth().oauth2(token)
        .when().get("/api/staff")
        .then().statusCode(200)
        .extract().jsonPath().getString("[0].id");

    given().auth().oauth2(token)
        .contentType("application/json")
        .body("""
            {
              "holidayDate": "%s",
              "name": "Demo closure %s"
            }
            """.formatted(
                LocalDate.now().plusYears(1).plusDays(System.currentTimeMillis() % 300),
                UUID.randomUUID()))
        .when().post("/api/settings/holidays")
        .then().statusCode(200)
        .body("name", notNullValue());

    given().auth().oauth2(token)
        .contentType("application/json")
        .body("""
            {
              "startTime": "%s",
              "endTime": "%s",
              "reason": "Training"
            }
            """.formatted(
                OffsetDateTime.now().plusDays(10).withHour(10).withMinute(0).withSecond(0).withNano(0),
                OffsetDateTime.now().plusDays(10).withHour(11).withMinute(0).withSecond(0).withNano(0)))
        .when().post("/api/staff/" + staffId + "/time-off")
        .then().statusCode(200)
        .body("staffId", notNullValue());
  }

  @Test
  void shouldRejectCustomerFromBusinessCatalog() {
    String customerToken = IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken");

    given().auth().oauth2(customerToken)
        .when().get("/api/services")
        .then().statusCode(403);
  }
}
