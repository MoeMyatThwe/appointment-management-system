package com.pm.appointmentservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
public class AppointmentStatusHistory {
  @Id private UUID id;
  private String tenantId;
  private UUID appointmentId;
  private String changedBy;
  private OffsetDateTime changedAt;
  private String previousStatus;
  private String newStatus;
  private String reason;

  public UUID getId() { return id; }
  public void setId(UUID value) { id = value; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public UUID getAppointmentId() { return appointmentId; }
  public void setAppointmentId(UUID value) { appointmentId = value; }
  public String getChangedBy() { return changedBy; }
  public void setChangedBy(String value) { changedBy = value; }
  public OffsetDateTime getChangedAt() { return changedAt; }
  public void setChangedAt(OffsetDateTime value) { changedAt = value; }
  public String getPreviousStatus() { return previousStatus; }
  public void setPreviousStatus(String value) { previousStatus = value; }
  public String getNewStatus() { return newStatus; }
  public void setNewStatus(String value) { newStatus = value; }
  public String getReason() { return reason; }
  public void setReason(String value) { reason = value; }
}
