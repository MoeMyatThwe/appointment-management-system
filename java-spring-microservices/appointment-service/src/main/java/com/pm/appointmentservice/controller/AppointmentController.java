package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.AppointmentRequestDTO;
import com.pm.appointmentservice.dto.AppointmentResponseDTO;
import com.pm.appointmentservice.dto.AppointmentTimeChangeDTO;
import com.pm.appointmentservice.dto.AppointmentStatusChangeDTO;
import com.pm.appointmentservice.dto.validators.CreateAppointmentValidationGroup;
import com.pm.appointmentservice.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.groups.Default;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.pm.appointmentservice.security.AccessPolicy;

@RestController
@RequestMapping("/appointments")
@Tag(name = "Appointment", description = "API for managing Appointments")
public class AppointmentController {

  private static final Logger auditLog = LoggerFactory.getLogger("AUDIT");
  private final AppointmentService appointmentService;

  public AppointmentController(AppointmentService appointmentService) {
    this.appointmentService = appointmentService;
  }

  @GetMapping
  @Operation(summary = "Get Appointments")
  public ResponseEntity<List<AppointmentResponseDTO>> getAppointments(
      @RequestHeader("X-Tenant-ID") String tenantId) {
    List<AppointmentResponseDTO> appointments = appointmentService.getAppointments(tenantId);
    return ResponseEntity.ok().body(appointments);
  }

  @GetMapping("/search")
  @Operation(summary = "Search and filter appointments")
  public ResponseEntity<?> searchAppointments(
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String from,
      @RequestParam(defaultValue = "") String to,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "") String staffId,
      @RequestParam(defaultValue = "") String customerId,
      @RequestParam(defaultValue = "") String serviceId,
      @RequestParam(defaultValue = "") String resourceId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "startTime") String sortBy,
      @RequestParam(defaultValue = "asc") String direction) {
    if (page < 0 || size < 1 || size > 100) {
      return ResponseEntity.badRequest()
          .body("page must be >= 0 and size must be between 1 and 100");
    }
    List<String> allowedSorts = List.of("startTime", "endTime", "status", "createdAt", "updatedAt");
    if (!allowedSorts.contains(sortBy)) {
      return ResponseEntity.badRequest().body("Unsupported sort field");
    }
    Sort.Direction sortDirection;
    try {
      sortDirection = Sort.Direction.fromString(direction);
    } catch (IllegalArgumentException exception) {
      return ResponseEntity.badRequest().body("direction must be asc or desc");
    }
    Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    return ResponseEntity.ok(appointmentService.searchAppointments(tenantId, search, from, to,
        status, staffId, customerId, serviceId, resourceId, pageable));
  }

  @PostMapping
  @Operation(summary = "Create a new appointment")
  public ResponseEntity<AppointmentResponseDTO> createAppointment(
      @Validated({Default.class, CreateAppointmentValidationGroup.class})
      @RequestBody AppointmentRequestDTO appointmentRequestDTO,
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String email) {
    requireWriteRole(role);
    auditLog.info("event=APPOINTMENT_CREATE tenantId={} user={} customerId={}",
        tenantId, email, appointmentRequestDTO.getCustomerId());

    AppointmentResponseDTO appointmentResponseDTO = appointmentService.createAppointment(
        appointmentRequestDTO, tenantId);

    return ResponseEntity.ok().body(appointmentResponseDTO);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update a new appointment")
  public ResponseEntity<AppointmentResponseDTO> updateAppointment(@PathVariable UUID id,
      @Validated({Default.class}) @RequestBody AppointmentRequestDTO appointmentRequestDTO,
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String email) {
    requireWriteRole(role);
    auditLog.info("event=APPOINTMENT_UPDATE tenantId={} user={} appointmentId={}",
        tenantId, email, id);

    AppointmentResponseDTO appointmentResponseDTO = appointmentService.updateAppointment(id,
        appointmentRequestDTO, tenantId);

    return ResponseEntity.ok().body(appointmentResponseDTO);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Delete a appointment")
  public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id,
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String email) {
    requireWriteRole(role);
    auditLog.info("event=APPOINTMENT_DELETE tenantId={} user={} appointmentId={}",
        tenantId, email, id);
    appointmentService.deleteAppointment(id, tenantId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/reschedule")
  public ResponseEntity<AppointmentResponseDTO> rescheduleAppointment(
      @PathVariable UUID id,
      @Validated @RequestBody AppointmentTimeChangeDTO timeChange,
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String email) {
    requireWriteRole(role);
    auditLog.info("event=APPOINTMENT_RESCHEDULE tenantId={} user={} appointmentId={}",
        tenantId, email, id);
    return ResponseEntity.ok(
        appointmentService.rescheduleAppointment(id, timeChange, tenantId));
  }

  @PatchMapping("/{id}/status")
  @Operation(summary = "Change appointment status")
  public ResponseEntity<AppointmentResponseDTO> changeStatus(
      @PathVariable UUID id,
      @Validated @RequestBody AppointmentStatusChangeDTO statusChange,
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String email) {
    requireWriteRole(role);
    auditLog.info("event=APPOINTMENT_STATUS_CHANGE tenantId={} user={} appointmentId={} status={}",
        tenantId, email, id, statusChange.status());
    return ResponseEntity.ok(appointmentService.changeStatus(id, statusChange, tenantId));
  }

  @PatchMapping("/{id}/cancel")
  public ResponseEntity<AppointmentResponseDTO> cancelAppointment(
      @PathVariable UUID id,
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String email) {
    requireWriteRole(role);
    auditLog.info("event=APPOINTMENT_CANCEL tenantId={} user={} appointmentId={}",
        tenantId, email, id);
    return ResponseEntity.ok(appointmentService.cancelAppointment(id, tenantId));
  }

  private void requireWriteRole(String role) {
    AccessPolicy.requireBusinessUser(role);
  }
}
