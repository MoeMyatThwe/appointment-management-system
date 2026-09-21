package com.pm.notificationservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_reminder")
public class NotificationReminder {
  @Id
  @GeneratedValue
  private UUID id;
  @Column(nullable = false, unique = true)
  private String appointmentId;
  @Column(nullable = false)
  private String eventId;
  @Column(nullable = false, columnDefinition = "bytea")
  private byte[] payload;
  @Column(nullable = false)
  private Instant scheduledAt;
  @Column(nullable = false)
  private String status;
  @Column(nullable = false)
  private int attempts;
  private Instant claimedUntil;
  @Column(nullable = false)
  private Instant createdAt;
  private Instant sentAt;

  public NotificationReminder() {}

  public UUID getId() { return id; }
  public String getAppointmentId() { return appointmentId; }
  public void setAppointmentId(String value) { appointmentId = value; }
  public String getEventId() { return eventId; }
  public void setEventId(String value) { eventId = value; }
  public byte[] getPayload() { return payload; }
  public void setPayload(byte[] value) { payload = value; }
  public Instant getScheduledAt() { return scheduledAt; }
  public void setScheduledAt(Instant value) { scheduledAt = value; }
  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }
  public int getAttempts() { return attempts; }
  public void setAttempts(int value) { attempts = value; }
  public Instant getClaimedUntil() { return claimedUntil; }
  public void setClaimedUntil(Instant value) { claimedUntil = value; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant value) { createdAt = value; }
  public Instant getSentAt() { return sentAt; }
  public void setSentAt(Instant value) { sentAt = value; }
}
