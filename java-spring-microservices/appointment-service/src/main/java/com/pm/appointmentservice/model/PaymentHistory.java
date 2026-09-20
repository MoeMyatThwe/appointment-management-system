package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointment_payment_history")
public class PaymentHistory {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private UUID appointmentId;
  @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
  @Column(nullable = false, length = 30) private String type;
  private String paymentMethod;
  @Column(nullable = false, length = 30) private String status;
  @Column(nullable = false) private String createdAt;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public UUID getAppointmentId() { return appointmentId; }
  public void setAppointmentId(UUID value) { appointmentId = value; }
  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal value) { amount = value; }
  public String getType() { return type; }
  public void setType(String value) { type = value; }
  public String getPaymentMethod() { return paymentMethod; }
  public void setPaymentMethod(String value) { paymentMethod = value; }
  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }
  public String getCreatedAt() { return createdAt; }
  public void setCreatedAt(String value) { createdAt = value; }
}
