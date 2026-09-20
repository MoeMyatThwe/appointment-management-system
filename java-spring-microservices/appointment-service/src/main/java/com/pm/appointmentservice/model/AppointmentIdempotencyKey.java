package com.pm.appointmentservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "appointment_idempotency_keys")
public class AppointmentIdempotencyKey {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;
  private String tenantId;
  private String idempotencyKey;
  private UUID appointmentId;
  private String createdAt;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public String getIdempotencyKey() { return idempotencyKey; }
  public void setIdempotencyKey(String value) { idempotencyKey = value; }
  public UUID getAppointmentId() { return appointmentId; }
  public void setAppointmentId(UUID value) { appointmentId = value; }
  public String getCreatedAt() { return createdAt; }
  public void setCreatedAt(String value) { createdAt = value; }
}
