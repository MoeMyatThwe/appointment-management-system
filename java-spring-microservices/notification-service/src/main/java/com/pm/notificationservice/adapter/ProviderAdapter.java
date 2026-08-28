package com.pm.notificationservice.adapter;

import appointment.events.AppointmentEvent;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ProviderAdapter implements NotificationAdapter {
  private static final Logger log = LoggerFactory.getLogger(ProviderAdapter.class);
  private final String channel;
  private final String provider;
  private final String webhookUrl;
  private final HttpClient httpClient;

  public ProviderAdapter(String channel, String provider, String webhookUrl) {
    this.channel = channel;
    this.provider = provider;
    this.webhookUrl = webhookUrl;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .build();
  }

  @Override
  public void send(AppointmentEvent event) {
    if (provider == null || provider.isBlank() || "none".equalsIgnoreCase(provider)) {
      log.debug("No {} provider configured; skipping appointmentId={}", channel,
          event.getAppointmentId());
      return;
    }

    if (webhookUrl == null || webhookUrl.isBlank()) {
      log.warn("Provider {} is configured for {} but no webhook URL is set; "
          + "skipping appointmentId={}", provider, channel, event.getAppointmentId());
      return;
    }

    String payload = """
        {"channel":"%s","provider":"%s","eventType":"%s","appointmentId":"%s",
        "tenantId":"%s","customerId":"%s","businessId":"%s","startTime":"%s",
        "endTime":"%s","status":"%s","notes":"%s"}
        """.formatted(escape(channel), escape(provider), escape(event.getEventType()),
        escape(event.getAppointmentId()), escape(event.getTenantId()), escape(event.getCustomerId()),
        escape(event.getBusinessId()), escape(event.getStartTime()), escape(event.getEndTime()),
        escape(event.getStatus()), escape(event.getNotes())).replaceAll("\\s+", "");

    HttpRequest request = HttpRequest.newBuilder(URI.create(webhookUrl))
        .timeout(Duration.ofSeconds(5))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(payload))
        .build();

    try {
      HttpResponse<Void> response = httpClient.send(request,
          HttpResponse.BodyHandlers.discarding());
      if (response.statusCode() >= 300) {
        throw new IllegalStateException("Notification webhook returned HTTP "
            + response.statusCode());
      }
      log.info("Dispatched {} notification via provider={} for appointmentId={} eventType={}",
          channel, provider, event.getAppointmentId(), event.getEventType());
    } catch (Exception exception) {
      throw new IllegalStateException("Unable to dispatch " + channel + " notification",
          exception);
    }
  }

  private String escape(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}
