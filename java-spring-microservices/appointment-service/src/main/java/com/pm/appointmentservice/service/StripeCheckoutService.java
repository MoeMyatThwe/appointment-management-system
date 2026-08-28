package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.CheckoutSessionDTO;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.AppointmentPayment;
import com.pm.appointmentservice.repository.AppointmentPaymentRepository;
import com.pm.appointmentservice.repository.AppointmentRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeCheckoutService {
  private static final Pattern URL_PATTERN = Pattern.compile("\"url\"\\s*:\\s*\"([^\"]+)\"");
  private final AppointmentRepository appointments;
  private final AppointmentPaymentRepository payments;
  private final String secretKey;
  private final String successUrl;
  private final String cancelUrl;
  private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  public StripeCheckoutService(AppointmentRepository appointments, AppointmentPaymentRepository payments,
      @Value("${stripe.secret-key:}") String secretKey,
      @Value("${stripe.success-url:http://localhost:5173/payment/success}") String successUrl,
      @Value("${stripe.cancel-url:http://localhost:5173/payment/cancelled}") String cancelUrl) {
    this.appointments = appointments; this.payments = payments; this.secretKey = secretKey;
    this.successUrl = successUrl; this.cancelUrl = cancelUrl;
  }

  public CheckoutSessionDTO create(UUID appointmentId, String tenant) {
    if (secretKey.isBlank()) throw new IllegalStateException("Stripe payments are not configured");
    Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Create a payment record before checkout"));
    BigDecimal balance = payment.getAmountDue().subtract(payment.getAmountPaid()).max(BigDecimal.ZERO);
    if (balance.signum() <= 0) throw new IllegalArgumentException("This appointment has no balance due");
    String form = form(
        "mode", "payment",
        "line_items[0][price_data][currency]", payment.getCurrency().toLowerCase(),
        "line_items[0][price_data][product_data][name]", "Appointment " + appointmentId,
        "line_items[0][price_data][unit_amount]", Long.toString(balance.movePointRight(2).longValueExact()),
        "line_items[0][quantity]", "1",
        "success_url", successUrl + "?appointmentId=" + appointmentId,
        "cancel_url", cancelUrl + "?appointmentId=" + appointmentId,
        "metadata[appointmentId]", appointmentId.toString(),
        "metadata[tenantId]", tenant);
    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.stripe.com/v1/checkout/sessions"))
          .timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + secretKey)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .POST(HttpRequest.BodyPublishers.ofString(form)).build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) throw new IllegalStateException("Stripe checkout request failed");
      var matcher = URL_PATTERN.matcher(response.body());
      if (!matcher.find()) throw new IllegalStateException("Stripe did not return a checkout URL");
      return new CheckoutSessionDTO(matcher.group(1).replace("\\/", "/"));
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to contact Stripe", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Stripe checkout request was interrupted", exception);
    }
  }

  private String form(String... values) {
    StringBuilder result = new StringBuilder();
    for (int index = 0; index < values.length; index += 2) {
      if (result.length() > 0) result.append('&');
      result.append(encode(values[index])).append('=').append(encode(values[index + 1]));
    }
    return result.toString();
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
