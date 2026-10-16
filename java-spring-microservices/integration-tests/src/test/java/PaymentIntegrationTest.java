import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.notNullValue;

import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class PaymentIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  void shouldRecordPaymentAndRefundAppointment() {
    String businessToken = IntegrationTestSupport.token();
    String customerToken = IntegrationTestSupport.customerLogin()
        .jsonPath().getString("accessToken");
    String tenantId = IntegrationTestSupport.tenantId();
    String appointmentId = createAppointment(businessToken, customerToken, tenantId);

    try {
      given().auth().oauth2(businessToken)
          .when().get("/api/appointments/" + appointmentId + "/payment")
          .then().statusCode(200)
          .body("status", equalTo("UNPAID"))
          .body("balance", notNullValue())
          .body("amountDue", greaterThan(0f));

      given().auth().oauth2(businessToken)
          .contentType("application/json")
          .body("""
              {
                "amountPaid": 10.00,
                "paymentMethod": "CARD",
                "currency": "USD"
              }
              """)
          .when().put("/api/appointments/" + appointmentId + "/payment")
          .then().statusCode(200)
          .body("status", equalTo("PARTIALLY_PAID"))
          .body("amountPaid", equalTo(10.0f))
          .body("refundStatus", equalTo("NOT_REFUNDED"));

      given().auth().oauth2(customerToken)
          .when().get("/api/customer/appointments/" + appointmentId + "/payment")
          .then().statusCode(200)
          .body("amountPaid", equalTo(10.0f));

      given().auth().oauth2(businessToken)
          .when().get("/api/appointments/" + appointmentId + "/payment/history")
          .then().statusCode(200)
          .body("size()", equalTo(1));

      given().auth().oauth2(businessToken)
          .when().patch("/api/appointments/" + appointmentId + "/payment/refund")
          .then().statusCode(200)
          .body("amountRefunded", equalTo(10.0f))
          .body("refundStatus", equalTo("REFUNDED"))
          .body("status", equalTo("REFUNDED"));

      given().auth().oauth2(businessToken)
          .when().patch("/api/appointments/" + appointmentId + "/payment/refund")
          .then().statusCode(400);
    } finally {
      given().auth().oauth2(businessToken)
          .when().delete("/api/appointments/" + appointmentId)
          .then().statusCode(204);
    }
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
