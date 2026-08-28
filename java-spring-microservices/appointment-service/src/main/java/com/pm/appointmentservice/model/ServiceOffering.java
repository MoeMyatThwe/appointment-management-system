package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "service_offering")
public class ServiceOffering {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private String name;
  private Integer durationMinutes;
  private String price;
  private String color;
  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String v) { tenantId = v; }
  public String getName() { return name; }
  public void setName(String v) { name = v; }
  public Integer getDurationMinutes() { return durationMinutes; }
  public void setDurationMinutes(Integer v) { durationMinutes = v; }
  public String getPrice() { return price; }
  public void setPrice(String v) { price = v; }
  public String getColor() { return color; }
  public void setColor(String v) { color = v; }
}
