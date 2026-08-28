package com.pm.appointmentservice.exception;

public class InvalidAppointmentStatusException extends RuntimeException {
  public InvalidAppointmentStatusException(String message) {
    super(message);
  }
}
