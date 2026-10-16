import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class AppointmentIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  public void shouldReturnAppointmentsWithValidToken() {
    String token = IntegrationTestSupport.token();

    given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/api/appointments")
        .then()
        .statusCode(200)
        .body("$", org.hamcrest.Matchers.notNullValue());
  }

  @Test
  public void shouldCreateTransitionAndDeleteAppointment() {
    String businessToken = IntegrationTestSupport.token();
    String customerToken = IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken");
    String tenantId = IntegrationTestSupport.tenantId();
    String serviceId = given().auth().oauth2(businessToken)
        .when().get("/api/services")
        .then().statusCode(200).extract().jsonPath().getString("[0].id");
    String staffId = given().auth().oauth2(businessToken)
        .when().get("/api/staff")
        .then().statusCode(200).extract().jsonPath().getString("[0].id");

    String date = given()
        .queryParam("from", LocalDate.now().plusDays(1).toString())
        .queryParam("to", LocalDate.now().plusDays(30).toString())
        .queryParam("serviceId", serviceId)
        .queryParam("staffId", staffId)
        .queryParam("timezone", "UTC")
        .when().get("/public/booking/" + tenantId + "/available-dates")
        .then().statusCode(200)
        .extract().jsonPath().getString("[0]");

    String startTime = given()
        .queryParam("date", date)
        .queryParam("serviceId", serviceId)
        .queryParam("staffId", staffId)
        .queryParam("timezone", "UTC")
        .when().get("/public/booking/" + tenantId + "/slots")
        .then().statusCode(200)
        .body("[0].startTime", notNullValue())
        .extract().jsonPath().getString("[0].startTime");
    String endTime = given()
        .queryParam("date", date)
        .queryParam("serviceId", serviceId)
        .queryParam("staffId", staffId)
        .queryParam("timezone", "UTC")
        .when().get("/public/booking/" + tenantId + "/slots")
        .then().statusCode(200)
        .extract().jsonPath().getString("[0].endTime");
    String idempotencyKey = UUID.randomUUID().toString();

    String appointmentId = given()
        .auth().oauth2(customerToken)
        .header("Idempotency-Key", idempotencyKey)
        .contentType("application/json")
        .body("""
            {
              "serviceId": "%s",
              "staffId": "%s",
              "startTime": "%s",
              "endTime": "%s",
              "customerName": "Demo Customer",
              "customerEmail": "demo.customer@example.com",
              "customerPhone": "+1-555-0101",
              "notes": "Lifecycle test"
            }
            """.formatted(serviceId, staffId, startTime, endTime))
        .when().post("/public/booking/" + tenantId + "/appointments")
        .then().log().ifValidationFails().statusCode(200)
        .body("status", equalTo("PENDING"))
        .body("id", notNullValue())
        .extract().jsonPath().getString("id");

    given().auth().oauth2(customerToken)
        .header("Idempotency-Key", idempotencyKey)
        .contentType("application/json")
        .body("""
            {
              "serviceId": "%s",
              "staffId": "%s",
              "startTime": "%s",
              "endTime": "%s",
              "customerName": "Demo Customer",
              "customerEmail": "demo.customer@example.com"
            }
            """.formatted(serviceId, staffId, startTime, endTime))
        .when().post("/public/booking/" + tenantId + "/appointments")
        .then().statusCode(200)
        .body("id", equalTo(appointmentId));

    given().auth().oauth2(businessToken)
        .contentType("application/json")
        .body("{\"status\":\"CONFIRMED\",\"reason\":\"Test confirmation\"}")
        .when().patch("/api/appointments/" + appointmentId + "/status")
        .then().statusCode(200)
        .body("status", equalTo("CONFIRMED"));

    given().auth().oauth2(businessToken)
        .contentType("application/json")
        .body("{\"status\":\"PENDING\"}")
        .when().patch("/api/appointments/" + appointmentId + "/status")
        .then().statusCode(400);

    given().auth().oauth2(businessToken)
        .when().delete("/api/appointments/" + appointmentId)
        .then().statusCode(204);
  }

  @Test
  public void shouldRejectAppointmentSearchWithInvalidPaging() {
    given().auth().oauth2(IntegrationTestSupport.token())
        .queryParam("page", -1)
        .when().get("/api/appointments/search")
        .then().statusCode(400);
  }
}
