package com.pm.appointmentservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Entity
public class Appointment {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @NotNull
  @Column(nullable = false)
  private String tenantId;

  @NotNull
  private String businessId;
  @NotNull
  private String customerId;
  @NotNull
  private String staffId;
  @NotNull
  private String serviceId;
  private String resourceId;
  @NotNull
  private String calendarId;
  @NotNull
  private String startTime;
  @NotNull
  private String endTime;
  @NotNull
  @Column(nullable = false)
  private String status;
  private String notes;
  @NotNull
  private String createdAt;
  @NotNull
  private String updatedAt;
  @Column(nullable = false) private boolean paymentRequired = false;
  private java.time.OffsetDateTime paymentDeadline;
  private java.time.OffsetDateTime bookingHoldExpiresAt;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getTenantId() {
    return tenantId;
  }

  public void setTenantId(String tenantId) {
    this.tenantId = tenantId;
  }

  public String getBusinessId() {
    return businessId;
  }

  public void setBusinessId(String businessId) {
    this.businessId = businessId;
  }

  public String getCustomerId() {
    return customerId;
  }

  public void setCustomerId(String customerId) {
    this.customerId = customerId;
  }

  public String getStaffId() {
    return staffId;
  }

  public void setStaffId(String staffId) {
    this.staffId = staffId;
  }

  public String getServiceId() {
    return serviceId;
  }

  public void setServiceId(String serviceId) {
    this.serviceId = serviceId;
  }

  public String getResourceId() {
    return resourceId;
  }

  public void setResourceId(String resourceId) {
    this.resourceId = resourceId;
  }

  public String getCalendarId() {
    return calendarId;
  }

  public void setCalendarId(String calendarId) {
    this.calendarId = calendarId;
  }

  public String getStartTime() {
    return startTime;
  }

  public void setStartTime(String startTime) {
    this.startTime = startTime;
  }

  public String getEndTime() {
    return endTime;
  }

  public void setEndTime(String endTime) {
    this.endTime = endTime;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }

  public String getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(String updatedAt) {
    this.updatedAt = updatedAt;
  }

  public boolean isPaymentRequired() { return paymentRequired; }
  public void setPaymentRequired(boolean value) { paymentRequired = value; }
  public java.time.OffsetDateTime getPaymentDeadline() { return paymentDeadline; }
  public void setPaymentDeadline(java.time.OffsetDateTime value) { paymentDeadline = value; }
  public java.time.OffsetDateTime getBookingHoldExpiresAt() { return bookingHoldExpiresAt; }
  public void setBookingHoldExpiresAt(java.time.OffsetDateTime value) { bookingHoldExpiresAt = value; }

}
