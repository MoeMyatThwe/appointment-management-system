package com.pm.appointmentservice.exception;

public class AppointmentNotFoundException extends RuntimeException {

  public AppointmentNotFoundException(String message) {
    super(message);
  }
}

