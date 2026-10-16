package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.CheckoutSessionDTO;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.AppointmentPayment;
import com.pm.appointmentservice.repository.AppointmentPaymentRepository;
import com.pm.appointmentservice.repository.StripeWebhookEventRepository;
import com.pm.appointmentservice.model.StripeWebhookEvent;
import com.pm.appointmentservice.repository.AppointmentRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.Objects;
import java.util.regex.Pattern;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeCheckoutService {
  private static final Pattern URL_PATTERN = Pattern.compile("\"url\"\\s*:\\s*\"([^\"]+)\"");
  private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");
  private static final Pattern PAYMENT_INTENT_PATTERN = Pattern.compile("\"payment_intent\"\\s*:\\s*(?:\"([^\"]+)\"|null)");
  private final AppointmentRepository appointments;
  private final AppointmentPaymentRepository payments;
  private final String secretKey;
  private final String successUrl;
  private final String cancelUrl;
  private final String webhookSecret;
  private final StripeWebhookEventRepository webhookEvents;
  private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  public StripeCheckoutService(AppointmentRepository appointments, AppointmentPaymentRepository payments,
      @Value("${stripe.secret-key:}") String secretKey,
      @Value("${stripe.success-url:http://localhost:5173/payment/success}") String successUrl,
      @Value("${stripe.cancel-url:http://localhost:5173/payment/cancelled}") String cancelUrl,
      @Value("${stripe.webhook-secret:}") String webhookSecret,
      StripeWebhookEventRepository webhookEvents) {
    this.appointments = appointments; this.payments = payments; this.secretKey = secretKey;
    this.successUrl = successUrl; this.cancelUrl = cancelUrl; this.webhookSecret = webhookSecret;
    this.webhookEvents = webhookEvents;
  }

  @Transactional
  public void handleWebhook(String payload, String signature) {
    if (webhookSecret.isBlank() || signature == null || signature.isBlank()) {
      throw new IllegalArgumentException("Stripe webhook verification is not configured");
    }
    try {
      Event event = com.stripe.net.Webhook.constructEvent(payload, signature, webhookSecret);
      if (webhookEvents.existsByEventId(event.getId())) return;
      switch (event.getType()) {
        case "checkout.session.completed" -> updateFromCheckout(event);
        case "payment_intent.succeeded" -> updateFromPaymentIntent(event, "PAID");
        case "payment_intent.payment_failed" -> updateFromPaymentIntent(event, "FAILED");
        default -> { }
      }
      StripeWebhookEvent processed = new StripeWebhookEvent();
      processed.setEventId(event.getId());
      processed.setEventType(event.getType());
      processed.setProcessedAt(java.time.OffsetDateTime.now().toString());
      webhookEvents.save(processed);
    } catch (Exception error) {
      throw new IllegalArgumentException("Invalid Stripe webhook", error);
    }
  }

  private void updateFromCheckout(Event event) {
    Session session = (Session) event.getDataObjectDeserializer().getObject().orElseThrow();
    String appointmentId = session.getMetadata() == null ? null : session.getMetadata().get("appointmentId");
    String tenantId = session.getMetadata() == null ? null : session.getMetadata().get("tenantId");
    if (appointmentId == null) return;
    payments.findByAppointmentId(UUID.fromString(appointmentId)).ifPresent(payment -> {
      if (!Objects.equals(payment.getTenantId(), tenantId)) return;
      if (session.getPaymentIntent() != null
          && session.getPaymentIntent().equals(payment.getStripePaymentIntentId())
          && payment.getAmountPaid().signum() > 0) return;
      payment.setStripeCheckoutSessionId(session.getId());
      if (session.getPaymentIntent() != null) {
        payment.setStripePaymentIntentId(session.getPaymentIntent());
      }
      if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
        applyPaidAmount(payment, session.getAmountTotal());
      }
      payment.setUpdatedAt(java.time.OffsetDateTime.now().toString());
      payments.save(payment);
    });
  }

  private void updateFromPaymentIntent(Event event, String status) {
    PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElseThrow();
    String paymentId = intent.getMetadata() == null ? null : intent.getMetadata().get("paymentId");
    String tenantId = intent.getMetadata() == null ? null : intent.getMetadata().get("tenantId");
    if (paymentId == null || tenantId == null) return;
    payments.findById(UUID.fromString(paymentId)).ifPresent(payment -> {
      if (!Objects.equals(payment.getTenantId(), tenantId)) return;
      if (intent.getId().equals(payment.getStripePaymentIntentId())
          && payment.getAmountPaid().signum() > 0) return;
      payment.setStripePaymentIntentId(intent.getId());
      if ("REFUNDED".equals(payment.getStatus())) return;
      if ("PAID".equals(status)) {
        applyPaidAmount(payment, intent.getAmountReceived());
      } else {
        payment.setStatus(status);
      }
      payment.setUpdatedAt(java.time.OffsetDateTime.now().toString());
      payments.save(payment);
    });
  }

  public CheckoutSessionDTO create(UUID appointmentId, String tenant) {
    if (secretKey.isBlank()) throw new IllegalStateException("Stripe payments are not configured");
    Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Create a payment record before checkout"));
    if ("REFUNDED".equals(payment.getStatus())) {
      throw new IllegalArgumentException("A refunded payment cannot be checked out");
    }
    BigDecimal balance = payment.getAmountPaid().signum() == 0
        && payment.getAmountRequired().signum() > 0
        ? payment.getAmountRequired()
        : payment.getAmountDue().subtract(payment.getAmountPaid()).max(BigDecimal.ZERO);
    if (balance.signum() <= 0) throw new IllegalArgumentException("This appointment has no balance due");
    String form = form(
        "mode", "payment",
        "line_items[0][price_data][currency]", payment.getCurrency().toLowerCase(),
        "line_items[0][price_data][product_data][name]", "Appointment " + appointmentId,
        "line_items[0][price_data][unit_amount]", Long.toString(balance.movePointRight(2).longValueExact()),
        "line_items[0][quantity]", "1",
        "success_url", successUrl + "?appointmentId=" + appointmentId + "&session_id={CHECKOUT_SESSION_ID}",
        "cancel_url", cancelUrl + "?appointmentId=" + appointmentId,
        "metadata[appointmentId]", appointmentId.toString(),
        "metadata[paymentId]", payment.getId().toString(),
        "metadata[tenantId]", tenant,
        "metadata[paymentAmount]", Long.toString(balance.movePointRight(2).longValueExact()),
        "payment_intent_data[metadata][paymentId]", payment.getId().toString(),
        "payment_intent_data[metadata][tenantId]", tenant);
    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.stripe.com/v1/checkout/sessions"))
          .timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + secretKey)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .POST(HttpRequest.BodyPublishers.ofString(form)).build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) throw new IllegalStateException("Stripe checkout request failed");
      var matcher = URL_PATTERN.matcher(response.body());
      if (!matcher.find()) throw new IllegalStateException("Stripe did not return a checkout URL");
      var sessionMatcher = ID_PATTERN.matcher(response.body());
      if (sessionMatcher.find()) payment.setStripeCheckoutSessionId(sessionMatcher.group(1));
      var intentMatcher = PAYMENT_INTENT_PATTERN.matcher(response.body());
      if (intentMatcher.find() && intentMatcher.group(1) != null) {
        payment.setStripePaymentIntentId(intentMatcher.group(1));
      }

      payment.setUpdatedAt(java.time.OffsetDateTime.now().toString());
      payments.save(payment);
      return new CheckoutSessionDTO(matcher.group(1).replace("\\/", "/"));
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to contact Stripe", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Stripe checkout request was interrupted", exception);
    }
  }

  public void refundPayment(String paymentIntentId, BigDecimal amount, String currency) {
    if (secretKey.isBlank()) {
      throw new IllegalStateException("Stripe payments are not configured");
    }
    String form = form(
        "payment_intent", paymentIntentId,
        "amount", Long.toString(amount.movePointRight(2).longValueExact()),
        "metadata[reason]", "appointment_refund");
    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.stripe.com/v1/refunds"))
          .timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + secretKey)
          .header("Idempotency-Key", "appointment-refund-" + paymentIntentId + "-"
              + amount.movePointRight(2).longValueExact())
          .header("Content-Type", "application/x-www-form-urlencoded")
          .POST(HttpRequest.BodyPublishers.ofString(form)).build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) {
        throw new IllegalStateException("Stripe refund request failed");
      }
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to contact Stripe for refund", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Stripe refund request was interrupted", exception);
    }
  }

  private void applyPaidAmount(AppointmentPayment payment, Long receivedCents) {
    BigDecimal received = receivedCents == null
        ? payment.getAmountRequired()
        : BigDecimal.valueOf(receivedCents).movePointLeft(2);
    BigDecimal paid = payment.getAmountPaid().add(received).min(payment.getAmountDue());
    payment.setAmountPaid(paid);
    payment.setStatus(paid.compareTo(payment.getAmountDue()) >= 0 ? "PAID" : "PARTIALLY_PAID");
    payment.setPaymentMethod("STRIPE");
  }

  @Transactional
  public void confirm(UUID appointmentId, String tenant, String sessionId) {
    if (secretKey.isBlank()) throw new IllegalStateException("Stripe payments are not configured");
    Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    if (sessionId == null || sessionId.isBlank()) sessionId = payment.getStripeCheckoutSessionId();
    if (sessionId == null || sessionId.isBlank()) {
      throw new IllegalArgumentException("Stripe checkout session not found");
    }
    try {
      Session session = Session.retrieve(sessionId,
          RequestOptions.builder().setApiKey(secretKey).build());
      String metadataAppointmentId = session.getMetadata() == null ? null : session.getMetadata().get("appointmentId");
      String metadataTenantId = session.getMetadata() == null ? null : session.getMetadata().get("tenantId");
      if (!appointmentId.toString().equals(metadataAppointmentId)
          || !tenant.equals(metadataTenantId)
          || !appointmentId.equals(appointment.getId())) {
        throw new IllegalArgumentException("Stripe session does not belong to this appointment");
      }
      if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
        applyPaidAmount(payment, session.getAmountTotal());
      } else {
        payment.setStatus("PENDING");
      }
      payment.setStripeCheckoutSessionId(session.getId());
      if (session.getPaymentIntent() != null) payment.setStripePaymentIntentId(session.getPaymentIntent());
      payment.setUpdatedAt(java.time.OffsetDateTime.now().toString());
      payments.save(payment);
    } catch (com.stripe.exception.StripeException exception) {
      throw new IllegalStateException("Unable to verify Stripe payment", exception);
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
