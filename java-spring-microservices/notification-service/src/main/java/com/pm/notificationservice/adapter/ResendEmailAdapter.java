package com.pm.notificationservice.adapter;

import appointment.events.AppointmentEvent;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ResendEmailAdapter implements NotificationAdapter {
  private final String apiKey;
  private final String from;
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5))
      .build();

  public ResendEmailAdapter(String apiKey, String from) {
    this.apiKey = apiKey;
    this.from = from;
  }

  @Override
  public void send(AppointmentEvent event) {
    if (apiKey == null || apiKey.isBlank() || from == null || from.isBlank()) {
      throw new IllegalStateException(
          "Resend email notifications require NOTIFICATION_EMAIL_API_KEY and "
              + "NOTIFICATION_EMAIL_FROM");
    }
    if (event.getEmail() == null || event.getEmail().isBlank()) {
      throw new IllegalStateException("Appointment notification has no customer email");
    }

    String subject = "Appointment " + event.getEventType().toLowerCase().replace('_', ' ');
    String html = """
        <p>Hello %s,</p>
        <p>Your appointment status is <strong>%s</strong>.</p>
        <p>Start: %s<br>End: %s</p>
        <p>Thank you.</p>
        """.formatted(escapeHtml(event.getName()), escapeHtml(event.getStatus()),
        escapeHtml(event.getStartTime()), escapeHtml(event.getEndTime()));
    String payload = """
        {"from":"%s","to":["%s"],"subject":"%s","html":"%s"}
        """.formatted(escapeJson(from), escapeJson(event.getEmail()),
        escapeJson(subject), escapeJson(html)).replaceAll("\\s+", " ");

    HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
        .timeout(Duration.ofSeconds(10))
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(payload))
        .build();
    try {
      HttpResponse<Void> response = httpClient.send(request,
          HttpResponse.BodyHandlers.discarding());
      if (response.statusCode() >= 300) {
        throw new IllegalStateException("Resend returned HTTP " + response.statusCode());
      }
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Resend email request was interrupted", exception);
    } catch (Exception exception) {
      throw new IllegalStateException("Unable to send email through Resend", exception);
    }
  }

  private String escapeJson(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"")
        .replace("\r", "\\r").replace("\n", "\\n");
  }

  private String escapeHtml(String value) {
    return value.replace("&", "&amp;").replace("<", "&lt;")
        .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  }
}
