package com.pm.notificationservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.Duration;

@Entity
@Table(name = "notification_processed_event")
public class ProcessedNotificationEvent {
  @Id
  private String eventId;
  private String eventType;
  private Instant processedAt;
  private String status;
  private Instant claimedUntil;

  protected ProcessedNotificationEvent() {}

  public ProcessedNotificationEvent(String eventId, String eventType, Instant processedAt) {
    this.eventId = eventId;
    this.eventType = eventType;
    this.processedAt = processedAt;
    this.status = "PROCESSING";
    this.claimedUntil = processedAt.plus(Duration.ofMinutes(5));
  }
}
