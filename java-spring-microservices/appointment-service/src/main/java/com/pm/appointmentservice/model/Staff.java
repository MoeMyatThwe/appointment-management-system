package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "staff")
public class Staff {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private String name;
  private String email;
  private String role;
  @Column(nullable = false) private boolean active = true;
  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String v) { tenantId = v; }
  public String getName() { return name; }
  public void setName(String v) { name = v; }
  public String getEmail() { return email; }
  public void setEmail(String v) { email = v; }
  public String getRole() { return role; }
  public void setRole(String v) { role = v; }
  public boolean isActive() { return active; }
  public void setActive(boolean v) { active = v; }
}
