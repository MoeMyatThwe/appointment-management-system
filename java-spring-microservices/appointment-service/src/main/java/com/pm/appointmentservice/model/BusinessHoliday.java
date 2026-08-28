package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "business_holiday")
public class BusinessHoliday {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(name = "holiday_date", nullable = false) private LocalDate holidayDate;
  @Column(nullable = false) private String name;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public LocalDate getHolidayDate() { return holidayDate; }
  public void setHolidayDate(LocalDate value) { holidayDate = value; }
  public String getName() { return name; }
  public void setName(String value) { name = value; }
}
