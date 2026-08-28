package com.pm.appointmentservice.exception;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(
      GlobalExceptionHandler.class);

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidationException(
      MethodArgumentNotValidException ex) {

    Map<String, String> errors = new HashMap<>();

    ex.getBindingResult().getFieldErrors().forEach(
        error -> errors.put(error.getField(), error.getDefaultMessage()));

    return ResponseEntity.badRequest().body(errors);
  }

  @ExceptionHandler(TimeSlotAlreadyBookedException.class)
  public ResponseEntity<Map<String, String>> handleTimeSlotAlreadyBookedException(
      TimeSlotAlreadyBookedException ex) {

    log.warn("Email address already exist {}", ex.getMessage());
    Map<String, String> errors = new HashMap<>();
    errors.put("message", ex.getMessage());
    return ResponseEntity.badRequest().body(errors);
  }

  @ExceptionHandler(AppointmentNotFoundException.class)
  public ResponseEntity<Map<String, String>> handleAppointmentNotFoundException(
      AppointmentNotFoundException ex) {
    log.warn("appointment not found {}", ex.getMessage());

    Map<String, String> errors = new HashMap<>();
    errors.put("message", "appointment not found");
    return ResponseEntity.badRequest().body(errors);
  }

  @ExceptionHandler(BusinessClosedException.class)
  public ResponseEntity<Map<String, String>> handleBusinessClosedException(
      BusinessClosedException ex) {
    Map<String, String> errors = new HashMap<>();
    errors.put("message", ex.getMessage());
    return ResponseEntity.badRequest().body(errors);
  }

  @ExceptionHandler(InvalidAppointmentStatusException.class)
  public ResponseEntity<Map<String, String>> handleInvalidAppointmentStatusException(
      InvalidAppointmentStatusException ex) {
    Map<String, String> errors = new HashMap<>();
    errors.put("message", ex.getMessage());
    return ResponseEntity.badRequest().body(errors);
  }
}
