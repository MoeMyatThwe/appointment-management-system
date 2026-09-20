package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stripe_webhook_event", uniqueConstraints = @UniqueConstraint(columnNames = "event_id"))
public class StripeWebhookEvent {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(name = "event_id", nullable = false, unique = true) private String eventId;
  @Column(name = "event_type", nullable = false) private String eventType;
  @Column(name = "processed_at", nullable = false) private String processedAt;

  public void setEventId(String value) { eventId = value; }
  public void setEventType(String value) { eventType = value; }
  public void setProcessedAt(String value) { processedAt = value; }
}
