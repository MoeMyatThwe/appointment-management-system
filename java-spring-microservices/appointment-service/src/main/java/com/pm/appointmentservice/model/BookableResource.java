package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "bookable_resource")
public class BookableResource {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private String name;
  @Column(nullable = false) private String resourceType;
  private String description;
  @Column(nullable = false) private Integer capacity = 1;
  @Column(nullable = false) private boolean active = true;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public String getName() { return name; }
  public void setName(String value) { name = value; }
  public String getResourceType() { return resourceType; }
  public void setResourceType(String value) { resourceType = value; }
  public String getDescription() { return description; }
  public void setDescription(String value) { description = value; }
  public Integer getCapacity() { return capacity; }
  public void setCapacity(Integer value) { capacity = value; }
  public boolean isActive() { return active; }
  public void setActive(boolean value) { active = value; }
}
