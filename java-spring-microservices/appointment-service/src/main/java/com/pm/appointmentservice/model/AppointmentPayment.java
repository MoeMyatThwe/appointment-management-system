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
  @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amountRequired = BigDecimal.ZERO;
  @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amountRefunded = BigDecimal.ZERO;
  @Column(nullable = false, length = 3) private String currency = "USD";
  @Column(nullable = false) private String paymentMode = "PAY_LATER";
  @Column(nullable = false) private String refundStatus = "NOT_REFUNDED";
  private String paymentMethod;
  private String stripeCheckoutSessionId;
  private String stripePaymentIntentId;
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
  public BigDecimal getAmountRequired() { return amountRequired; }
  public void setAmountRequired(BigDecimal value) { amountRequired = value; }
  public BigDecimal getAmountRefunded() { return amountRefunded; }
  public void setAmountRefunded(BigDecimal value) { amountRefunded = value; }
  public String getCurrency() { return currency; }
  public void setCurrency(String value) { currency = value; }
  public String getPaymentMode() { return paymentMode; }
  public void setPaymentMode(String value) { paymentMode = value; }
  public String getRefundStatus() { return refundStatus; }
  public void setRefundStatus(String value) { refundStatus = value; }
  public String getPaymentMethod() { return paymentMethod; }
  public void setPaymentMethod(String value) { paymentMethod = value; }
  public String getStripeCheckoutSessionId() { return stripeCheckoutSessionId; }
  public void setStripeCheckoutSessionId(String value) { stripeCheckoutSessionId = value; }
  public String getStripePaymentIntentId() { return stripePaymentIntentId; }
  public void setStripePaymentIntentId(String value) { stripePaymentIntentId = value; }
  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }
  public String getReceiptNumber() { return receiptNumber; }
  public void setReceiptNumber(String value) { receiptNumber = value; }
  public String getCreatedAt() { return createdAt; }
  public void setCreatedAt(String value) { createdAt = value; }
  public String getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(String value) { updatedAt = value; }
}
