package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointment_event_outbox")
public class AppointmentEventOutbox {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String aggregateId;
  @Column(nullable = false) private String eventType;
  @Column(nullable = false, columnDefinition = "bytea") private byte[] payload;
  @Column(nullable = false) private String status = "PENDING";
  @Column(nullable = false) private int attempts;
  @Column(nullable = false) private String createdAt;
  private String publishedAt;
  private String lastError;

  public UUID getId() { return id; }
  public String getAggregateId() { return aggregateId; }
  public void setAggregateId(String value) { aggregateId = value; }
  public String getEventType() { return eventType; }
  public void setEventType(String value) { eventType = value; }
  public byte[] getPayload() { return payload; }
  public void setPayload(byte[] value) { payload = value; }
  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }
  public int getAttempts() { return attempts; }
  public void setAttempts(int value) { attempts = value; }
  public String getCreatedAt() { return createdAt; }
  public void setCreatedAt(String value) { createdAt = value; }
  public String getPublishedAt() { return publishedAt; }
  public void setPublishedAt(String value) { publishedAt = value; }
  public String getLastError() { return lastError; }
  public void setLastError(String value) { lastError = value; }
}
