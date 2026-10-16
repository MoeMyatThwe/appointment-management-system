import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;

import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class CustomerPortalIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  void shouldListViewPaymentAndCancelOwnedAppointment() {
    String businessToken = IntegrationTestSupport.token();
    String customerToken = IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken");
    String tenantId = IntegrationTestSupport.tenantId();
    String appointmentId = createAppointment(businessToken, customerToken, tenantId);

    given().auth().oauth2(customerToken)
        .when().get("/api/customer/appointments")
        .then().statusCode(200)
        .body("content.size()", greaterThanOrEqualTo(1))
        .body("content.find { it.id == '" + appointmentId + "' }.status", equalTo("PENDING"))
        .body("content.find { it.id == '" + appointmentId + "' }.paymentStatus", equalTo("UNPAID"));

    given().auth().oauth2(customerToken)
        .when().get("/api/customer/appointments/" + appointmentId + "/payment")
        .then().statusCode(200)
        .body("status", equalTo("UNPAID"))
        .body("balance", notNullValue());

    given().auth().oauth2(customerToken)
        .when().post("/api/customer/appointments/" + appointmentId + "/cancel")
        .then().statusCode(200)
        .body("id", equalTo(appointmentId))
        .body("status", equalTo("CANCELLED"));
  }

  @Test
  void shouldRejectInvalidCustomerPortalPaginationAndBusinessAccess() {
    given().auth().oauth2(IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken"))
        .queryParam("page", -1)
        .when().get("/api/customer/appointments")
        .then().statusCode(400);

    given().auth().oauth2(IntegrationTestSupport.token())
        .when().get("/api/customer/appointments")
        .then().statusCode(403);
  }

  private String createAppointment(String businessToken, String customerToken, String tenantId) {
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
        .then().statusCode(200).extract().jsonPath().getString("[0]");
    String slotPath = "/public/booking/" + tenantId + "/slots";
    String startTime = given().queryParam("date", date).queryParam("serviceId", serviceId)
        .queryParam("staffId", staffId).queryParam("timezone", "UTC")
        .when().get(slotPath).then().statusCode(200)
        .extract().jsonPath().getString("[0].startTime");
    String endTime = given().queryParam("date", date).queryParam("serviceId", serviceId)
        .queryParam("staffId", staffId).queryParam("timezone", "UTC")
        .when().get(slotPath).then().statusCode(200)
        .extract().jsonPath().getString("[0].endTime");

    return given().auth().oauth2(customerToken)
        .header("Idempotency-Key", UUID.randomUUID().toString())
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
        .extract().jsonPath().getString("id");
  }
}
