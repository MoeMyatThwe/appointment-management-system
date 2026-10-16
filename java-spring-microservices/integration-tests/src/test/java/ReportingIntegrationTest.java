import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class ReportingIntegrationTest {
  @BeforeAll
  static void setUp() {
    IntegrationTestSupport.configure();
  }

  @Test
  void shouldLoadDashboardAndReportSummaries() {
    String token = IntegrationTestSupport.token();

    given().auth().oauth2(token)
        .when().get("/api/appointments/dashboard/summary")
        .then().statusCode(200)
        .body("appointmentsToday", notNullValue());

    given().auth().oauth2(token)
        .when().get("/api/appointments/reports/summary")
        .then().statusCode(200);
  }

  @Test
  void shouldExportAppointmentAndCustomerReports() {
    String token = IntegrationTestSupport.token();

    given().auth().oauth2(token)
        .when().get("/api/appointments/reports/export/appointments")
        .then().statusCode(200)
        .contentType(org.hamcrest.Matchers.containsString("text/csv"));

    given().auth().oauth2(token)
        .when().get("/api/appointments/reports/export/customers")
        .then().statusCode(200)
        .contentType(org.hamcrest.Matchers.containsString("text/csv"));
  }
}
