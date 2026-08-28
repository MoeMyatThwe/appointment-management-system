package com.pm.appointmentservice.dto;

import com.pm.appointmentservice.dto.validators.CreateAppointmentValidationGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AppointmentRequestDTO {

  @NotBlank(message = "Business ID is required")
  private String businessId;
  @NotBlank(message = "Customer ID is required")
  private String customerId;
  @NotBlank(message = "Staff ID is required")
  private String staffId;
  @NotBlank(message = "Service ID is required")
  private String serviceId;
  private String resourceId;
  @NotBlank(message = "Calendar ID is required")
  private String calendarId;
  @NotBlank(message = "Start time is required")
  private String startTime;
  @NotBlank(message = "End time is required")
  private String endTime;
  @NotBlank(groups = CreateAppointmentValidationGroup.class, message = "Status is required")
  private String status;
  @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
  private String notes;

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

}
