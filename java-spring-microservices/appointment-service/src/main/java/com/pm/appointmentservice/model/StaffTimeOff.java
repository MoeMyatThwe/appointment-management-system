package com.pm.appointmentservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "staff_time_off")
public class StaffTimeOff {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  private String tenantId;
  private String staffId;
  private String startTime;
  private String endTime;
  private String reason;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public String getStaffId() { return staffId; }
  public void setStaffId(String value) { staffId = value; }
  public String getStartTime() { return startTime; }
  public void setStartTime(String value) { startTime = value; }
  public String getEndTime() { return endTime; }
  public void setEndTime(String value) { endTime = value; }
  public String getReason() { return reason; }
  public void setReason(String value) { reason = value; }
}
