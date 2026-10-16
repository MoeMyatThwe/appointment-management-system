package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "customer")
public class Customer {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private String name;
  @Column(nullable = false) private String email;
  private UUID customerAccountId;
  private String phone;
  private String notes;
  private String customerGroup;
  private String tags;
  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String v) { tenantId = v; }
  public String getName() { return name; }
  public void setName(String v) { name = v; }
  public String getEmail() { return email; }
  public void setEmail(String v) { email = v; }
  public UUID getCustomerAccountId() { return customerAccountId; }
  public void setCustomerAccountId(UUID v) { customerAccountId = v; }
  public String getPhone() { return phone; }
  public void setPhone(String v) { phone = v; }
  public String getNotes() { return notes; }
  public void setNotes(String v) { notes = v; }
  public String getCustomerGroup() { return customerGroup; }
  public void setCustomerGroup(String v) { customerGroup = v; }
  public String getTags() { return tags; }
  public void setTags(String v) { tags = v; }
}
