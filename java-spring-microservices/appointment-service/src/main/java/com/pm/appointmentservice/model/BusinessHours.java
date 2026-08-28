package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "business_hours")
public class BusinessHours {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private Integer dayOfWeek;
  @Column(nullable = false) private boolean enabled;
  private LocalTime openTime;
  private LocalTime closeTime;
  private LocalTime breakStart;
  private LocalTime breakEnd;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public Integer getDayOfWeek() { return dayOfWeek; }
  public void setDayOfWeek(Integer value) { dayOfWeek = value; }
  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean value) { enabled = value; }
  public LocalTime getOpenTime() { return openTime; }
  public void setOpenTime(LocalTime value) { openTime = value; }
  public LocalTime getCloseTime() { return closeTime; }
  public void setCloseTime(LocalTime value) { closeTime = value; }
  public LocalTime getBreakStart() { return breakStart; }
  public void setBreakStart(LocalTime value) { breakStart = value; }
  public LocalTime getBreakEnd() { return breakEnd; }
  public void setBreakEnd(LocalTime value) { breakEnd = value; }
}
