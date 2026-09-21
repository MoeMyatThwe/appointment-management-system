package com.pm.notificationservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.Duration;
import java.util.UUID;

@Entity
@Table(name = "notification_delivery",
    uniqueConstraints = @UniqueConstraint(name = "uq_notification_delivery",
        columnNames = {"eventId", "eventType", "adapterName"}))
public class NotificationDelivery {
  @Id
  @GeneratedValue
  private UUID id;
  private String eventId;
  private String eventType;
  private String adapterName;
  private Instant deliveredAt;
  private String status;
  private Instant claimedUntil;
  private int attempts;

  public NotificationDelivery() {}

  public NotificationDelivery(String eventId, String eventType, String adapterName,
      Instant deliveredAt) {
    this.eventId = eventId;
    this.eventType = eventType;
    this.adapterName = adapterName;
    this.deliveredAt = deliveredAt;
    this.status = "PROCESSING";
    this.claimedUntil = deliveredAt.plus(Duration.ofMinutes(5));
  }
}
