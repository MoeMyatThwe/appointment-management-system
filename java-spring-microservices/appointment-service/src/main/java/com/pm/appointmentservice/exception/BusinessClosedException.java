package com.pm.appointmentservice.exception;

public class BusinessClosedException extends RuntimeException {
  public BusinessClosedException(String message) {
    super(message);
  }
}
