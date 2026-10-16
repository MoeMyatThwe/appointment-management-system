package com.pm.appointmentservice.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "booking_payment_policy")
public class BookingPaymentPolicy {
  @Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;
  @Column(nullable = false, unique = true) private String tenantId;
  @Column(nullable = false) private String paymentMode = "PAY_LATER";
  @Column(nullable = false, precision = 5, scale = 2) private BigDecimal depositPercent = BigDecimal.ZERO;
  @Column(nullable = false) private int cancellationWindowMinutes = 1440;
  @Column(nullable = false, precision = 5, scale = 2) private BigDecimal refundablePercent = BigDecimal.valueOf(100);
  @Column(nullable = false, length = 3) private String currency = "USD";

  public UUID getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public String getPaymentMode() { return paymentMode; }
  public void setPaymentMode(String value) { paymentMode = value; }
  public BigDecimal getDepositPercent() { return depositPercent; }
  public void setDepositPercent(BigDecimal value) { depositPercent = value; }
  public int getCancellationWindowMinutes() { return cancellationWindowMinutes; }
  public void setCancellationWindowMinutes(int value) { cancellationWindowMinutes = value; }
  public BigDecimal getRefundablePercent() { return refundablePercent; }
  public void setRefundablePercent(BigDecimal value) { refundablePercent = value; }
  public String getCurrency() { return currency; }
  public void setCurrency(String value) { currency = value; }
}
