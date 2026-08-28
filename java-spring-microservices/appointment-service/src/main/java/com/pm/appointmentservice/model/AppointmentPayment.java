package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "appointment_payment")
public class AppointmentPayment {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false, unique = true) private UUID appointmentId;
  @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amountDue = BigDecimal.ZERO;
  @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amountPaid = BigDecimal.ZERO;
  @Column(nullable = false, length = 3) private String currency = "USD";
  private String paymentMethod;
  @Column(nullable = false) private String status = "UNPAID";
  @Column(nullable = false, unique = true) private String receiptNumber;
  @Column(nullable = false) private String createdAt;
  @Column(nullable = false) private String updatedAt;

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public UUID getAppointmentId() { return appointmentId; }
  public void setAppointmentId(UUID value) { appointmentId = value; }
  public BigDecimal getAmountDue() { return amountDue; }
  public void setAmountDue(BigDecimal value) { amountDue = value; }
  public BigDecimal getAmountPaid() { return amountPaid; }
  public void setAmountPaid(BigDecimal value) { amountPaid = value; }
  public String getCurrency() { return currency; }
  public void setCurrency(String value) { currency = value; }
  public String getPaymentMethod() { return paymentMethod; }
  public void setPaymentMethod(String value) { paymentMethod = value; }
  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }
  public String getReceiptNumber() { return receiptNumber; }
  public void setReceiptNumber(String value) { receiptNumber = value; }
  public String getCreatedAt() { return createdAt; }
  public void setCreatedAt(String value) { createdAt = value; }
  public String getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(String value) { updatedAt = value; }
}
