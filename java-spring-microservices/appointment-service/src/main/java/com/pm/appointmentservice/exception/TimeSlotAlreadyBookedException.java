package com.pm.appointmentservice.exception;

public class TimeSlotAlreadyBookedException extends RuntimeException {

  public TimeSlotAlreadyBookedException(String message) {
    super(message);
  }
}

