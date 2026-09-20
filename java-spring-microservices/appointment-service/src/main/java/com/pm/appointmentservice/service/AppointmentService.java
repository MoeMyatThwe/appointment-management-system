package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.AppointmentRequestDTO;
import com.pm.appointmentservice.dto.AppointmentResponseDTO;
import com.pm.appointmentservice.dto.AppointmentTimeChangeDTO;
import com.pm.appointmentservice.dto.AppointmentStatusChangeDTO;
import com.pm.appointmentservice.exception.TimeSlotAlreadyBookedException;
import com.pm.appointmentservice.exception.AppointmentNotFoundException;
import com.pm.appointmentservice.exception.InvalidAppointmentStatusException;
import com.pm.appointmentservice.grpc.BillingServiceGrpcClient;
import com.pm.appointmentservice.kafka.KafkaProducer;
import com.pm.appointmentservice.mapper.AppointmentMapper;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.AppointmentStatusHistory;
import com.pm.appointmentservice.repository.AppointmentRepository;
import com.pm.appointmentservice.repository.AppointmentStatusHistoryRepository;
import com.pm.appointmentservice.repository.CustomerRepository;
import com.pm.appointmentservice.repository.StaffRepository;
import com.pm.appointmentservice.repository.ServiceOfferingRepository;
import com.pm.appointmentservice.repository.BookableResourceRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

@Service
public class AppointmentService {

  private static final Map<String, Set<String>> ALLOWED_STATUS_TRANSITIONS = Map.of(
      "PENDING", Set.of("CONFIRMED", "CANCELLED"),
      "CONFIRMED", Set.of("CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"),
      "CHECKED_IN", Set.of("COMPLETED", "CANCELLED"),
      "COMPLETED", Set.of(),
      "CANCELLED", Set.of(),
      "NO_SHOW", Set.of());

  private final AppointmentRepository appointmentRepository;
  private final BillingServiceGrpcClient billingServiceGrpcClient;
  private final KafkaProducer kafkaProducer;
  private final ScheduleService scheduleService;
  private final AppointmentStatusHistoryRepository statusHistoryRepository;
  private final CustomerRepository customerRepository;
  private final StaffRepository staffRepository;
  private final ServiceOfferingRepository serviceRepository;
  private final BookableResourceRepository resourceRepository;
  private final EntityManager entityManager;
  @Value("${appointment.booking-buffer-minutes:0}")
  private int bookingBufferMinutes;

  public AppointmentService(AppointmentRepository appointmentRepository,
      BillingServiceGrpcClient billingServiceGrpcClient,
      KafkaProducer kafkaProducer,
      ScheduleService scheduleService,
      AppointmentStatusHistoryRepository statusHistoryRepository,
      CustomerRepository customerRepository,
      StaffRepository staffRepository,
      ServiceOfferingRepository serviceRepository,
      BookableResourceRepository resourceRepository,
      EntityManager entityManager) {
    this.appointmentRepository = appointmentRepository;
    this.billingServiceGrpcClient = billingServiceGrpcClient;
    this.kafkaProducer = kafkaProducer;
    this.scheduleService = scheduleService;
    this.statusHistoryRepository = statusHistoryRepository;
    this.customerRepository = customerRepository;
    this.staffRepository = staffRepository;
    this.serviceRepository = serviceRepository;
    this.resourceRepository = resourceRepository;
    this.entityManager = entityManager;
  }

  private void ensureReschedulable(Appointment appointment) {
    if (Set.of("CANCELLED", "COMPLETED", "NO_SHOW").contains(appointment.getStatus())) {
      throw new IllegalStateException("This appointment can no longer be rescheduled");
    }
  }

  public void lockTenantBookings(String tenantId) {
    entityManager.createNativeQuery(
        "select pg_advisory_xact_lock(hashtextextended(:lockKey, 0))")
        .setParameter("lockKey", "appointment-booking:" + tenantId)
        .getSingleResult();
  }

  private void validateReferences(AppointmentRequestDTO request, String tenantId) {
    UUID customerId = parseReference(request.getCustomerId(), "customer");
    UUID staffId = parseReference(request.getStaffId(), "staff member");
    UUID serviceId = parseReference(request.getServiceId(), "service");
    if (customerRepository.findByIdAndTenantId(customerId, tenantId).isEmpty()
        || staffRepository.findByIdAndTenantIdAndActiveTrue(staffId, tenantId).isEmpty()
        || serviceRepository.findById(serviceId).filter(item -> tenantId.equals(item.getTenantId())).isEmpty()) {
      throw new IllegalArgumentException("Selected customer, staff member, or service is not available in this workspace");
    }
    if (request.getResourceId() != null && !request.getResourceId().isBlank()) {
      UUID resourceId = parseReference(request.getResourceId(), "resource");
      if (resourceRepository.findByIdAndTenantId(resourceId, tenantId).isEmpty()) {
        throw new IllegalArgumentException("Selected resource is not available in this workspace");
      }
    }
  }

  private UUID parseReference(String value, String label) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException | NullPointerException exception) {
      throw new IllegalArgumentException("A valid " + label + " is required");
    }
  }

  public List<AppointmentResponseDTO> getAppointments(String tenantId) {
    List<Appointment> appointments = appointmentRepository.findAllByTenantId(tenantId);

    return appointments.stream().map(AppointmentMapper::toDTO).toList();
  }

  @Transactional
  public AppointmentResponseDTO createAppointment(AppointmentRequestDTO appointmentRequestDTO,
      String tenantId) {
    return createAppointment(appointmentRequestDTO, tenantId, "UTC");
  }

  public Page<AppointmentResponseDTO> searchAppointments(String tenantId, String search,
      String fromTime, String toTime, String status, String paymentStatus, String staffId, String customerId,
      String serviceId, String resourceId, Pageable pageable) {
    return appointmentRepository.search(tenantId, normalize(search), normalize(fromTime),
        normalize(toTime), normalize(status), normalize(paymentStatus), normalize(staffId), normalize(customerId),
        normalize(serviceId), normalize(resourceId), pageable).map(AppointmentMapper::toDTO);
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim();
  }

  @Transactional
  public AppointmentResponseDTO createAppointment(AppointmentRequestDTO appointmentRequestDTO,
      String tenantId, String timezone) {
    if (!"PENDING".equalsIgnoreCase(appointmentRequestDTO.getStatus())) {
      throw new InvalidAppointmentStatusException("New appointments must start with PENDING status");
    }
    lockTenantBookings(tenantId);
    validateReferences(appointmentRequestDTO, tenantId);
    appointmentRequestDTO.setBusinessId(tenantId);
    scheduleService.validateAppointmentWindow(tenantId, appointmentRequestDTO.getStartTime(),
        appointmentRequestDTO.getEndTime(), timezone);
    appointmentRequestDTO.setStartTime(scheduleService.normalizeToUtc(
        appointmentRequestDTO.getStartTime(), timezone));
    appointmentRequestDTO.setEndTime(scheduleService.normalizeToUtc(
        appointmentRequestDTO.getEndTime(), timezone));
    if (scheduleService.overlapsTimeOff(tenantId, appointmentRequestDTO.getStaffId(),
        appointmentRequestDTO.getStartTime(), appointmentRequestDTO.getEndTime())) {
      throw new TimeSlotAlreadyBookedException("The selected staff member is unavailable");
    }
    validateNoOverlap(appointmentRequestDTO, tenantId, null);

    Appointment newAppointment = appointmentRepository.save(
        AppointmentMapper.toModel(appointmentRequestDTO, tenantId));

    billingServiceGrpcClient.createBillingAccount(newAppointment.getId().toString(),
            newAppointment.getCustomerId(), newAppointment.getBusinessId());

    kafkaProducer.sendEvent(newAppointment);

    return AppointmentMapper.toDTO(newAppointment);
  }

  @Transactional
  public AppointmentResponseDTO updateAppointment(UUID id,
      AppointmentRequestDTO appointmentRequestDTO, String tenantId, String actor, String timezone) {

    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    ensureReschedulable(appointment);
    lockTenantBookings(tenantId);
    validateReferences(appointmentRequestDTO, tenantId);
    scheduleService.validateAppointmentWindow(tenantId, appointmentRequestDTO.getStartTime(),
        appointmentRequestDTO.getEndTime(), timezone);
    appointmentRequestDTO.setStartTime(scheduleService.normalizeToUtc(
        appointmentRequestDTO.getStartTime(), timezone));
    appointmentRequestDTO.setEndTime(scheduleService.normalizeToUtc(
        appointmentRequestDTO.getEndTime(), timezone));
    if (scheduleService.overlapsTimeOff(tenantId, appointmentRequestDTO.getStaffId(),
        appointmentRequestDTO.getStartTime(), appointmentRequestDTO.getEndTime())) {
      throw new TimeSlotAlreadyBookedException("The selected staff member is unavailable");
    }
    validateNoOverlap(appointmentRequestDTO, tenantId, id);

    boolean rescheduled = !appointment.getStartTime().equals(appointmentRequestDTO.getStartTime())
        || !appointment.getEndTime().equals(appointmentRequestDTO.getEndTime());
    appointment.setBusinessId(tenantId);
    appointment.setCustomerId(appointmentRequestDTO.getCustomerId());
    appointment.setStaffId(appointmentRequestDTO.getStaffId());
    appointment.setServiceId(appointmentRequestDTO.getServiceId());
    appointment.setResourceId(appointmentRequestDTO.getResourceId());
    appointment.setCalendarId(appointmentRequestDTO.getCalendarId());
    appointment.setStartTime(appointmentRequestDTO.getStartTime());
    appointment.setEndTime(appointmentRequestDTO.getEndTime());
    if (appointmentRequestDTO.getStatus() != null
        && !appointmentRequestDTO.getStatus().isBlank()) {
      String previousStatus = appointment.getStatus();
      String nextStatus = appointmentRequestDTO.getStatus().trim().toUpperCase();
      validateStatusTransition(previousStatus, nextStatus);
      appointment.setStatus(nextStatus);
      if (!previousStatus.equals(nextStatus)) {
        recordStatusChange(appointment, previousStatus, nextStatus, actor, null);
      }
    }
    appointment.setNotes(appointmentRequestDTO.getNotes());
    appointment.setUpdatedAt(OffsetDateTime.now().toString());

    Appointment updatedAppointment = appointmentRepository.save(appointment);
    kafkaProducer.sendEvent(updatedAppointment,
        rescheduled ? "APPOINTMENT_RESCHEDULED" : "APPOINTMENT_UPDATED");
    return AppointmentMapper.toDTO(updatedAppointment);
  }

  @Transactional
  public void deleteAppointment(UUID id, String tenantId, String actor) {
    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    changeStatus(id, new AppointmentStatusChangeDTO("CANCELLED", "Appointment archived"), tenantId, actor);
  }

  @Transactional
  public AppointmentResponseDTO rescheduleAppointment(UUID id,
      AppointmentTimeChangeDTO timeChange, String tenantId, String timezone) {
    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    ensureReschedulable(appointment);
    lockTenantBookings(tenantId);
    scheduleService.validateAppointmentWindow(tenantId, timeChange.startTime(), timeChange.endTime(), timezone);
    String startTime = scheduleService.normalizeToUtc(timeChange.startTime(), timezone);
    String endTime = scheduleService.normalizeToUtc(timeChange.endTime(), timezone);
    String conflictStart = buffered(startTime, -bookingBufferMinutes);
    String conflictEnd = buffered(endTime, bookingBufferMinutes);
    if (appointmentRepository.existsStaffOverlap(tenantId, appointment.getStaffId(),
        conflictStart, conflictEnd)
        || scheduleService.overlapsTimeOff(tenantId, appointment.getStaffId(), conflictStart, conflictEnd)
        || appointmentRepository.existsCustomerOverlap(tenantId, appointment.getCustomerId(),
        conflictStart, conflictEnd, id)
        || (appointment.getResourceId() != null && appointmentRepository.existsResourceOverlap(
        tenantId, appointment.getResourceId(), conflictStart, conflictEnd, id))) {
      throw new TimeSlotAlreadyBookedException("The selected time overlaps another appointment");
    }
    appointment.setStartTime(startTime);
    appointment.setEndTime(endTime);
    appointment.setUpdatedAt(OffsetDateTime.now().toString());
    Appointment updated = appointmentRepository.save(appointment);
    kafkaProducer.sendEvent(updated, "APPOINTMENT_RESCHEDULED");
    return AppointmentMapper.toDTO(updated);
  }

  private void validateNoOverlap(AppointmentRequestDTO input, String tenantId, UUID appointmentId) {
    String startTime = buffered(input.getStartTime(), -bookingBufferMinutes);
    String endTime = buffered(input.getEndTime(), bookingBufferMinutes);
    if (appointmentRepository.existsStaffOverlap(tenantId, input.getStaffId(),
        startTime, endTime)
        || scheduleService.overlapsTimeOff(tenantId, input.getStaffId(), startTime, endTime)
        || appointmentRepository.existsCustomerOverlap(tenantId, input.getCustomerId(),
        startTime, endTime, appointmentId)
        || (input.getResourceId() != null && !input.getResourceId().isBlank()
        && appointmentRepository.existsResourceOverlap(tenantId, input.getResourceId(),
        startTime, endTime, appointmentId))) {
      throw new TimeSlotAlreadyBookedException("The selected time overlaps another appointment");
    }
  }

  private String buffered(String value, int minutes) {
    return Instant.parse(value).plus(Duration.ofMinutes(minutes)).toString();
  }

  public AppointmentResponseDTO cancelAppointment(UUID id, String tenantId) {
    return changeStatus(id, new AppointmentStatusChangeDTO("CANCELLED", null), tenantId, "system");
  }

  @Transactional
  public AppointmentResponseDTO changeStatus(UUID id, AppointmentStatusChangeDTO statusChange,
      String tenantId, String actor) {
    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    String nextStatus = statusChange.status().trim().toUpperCase();
    validateStatusTransition(appointment.getStatus(), nextStatus);
    String previousStatus = appointment.getStatus();
    appointment.setStatus(nextStatus);
    appointment.setUpdatedAt(OffsetDateTime.now().toString());
    Appointment updated = appointmentRepository.save(appointment);
    if (!previousStatus.equals(nextStatus)) {
      recordStatusChange(updated, previousStatus, nextStatus, actor, statusChange.reason());
    }
    kafkaProducer.sendEvent(updated,
        "CANCELLED".equals(nextStatus) ? "APPOINTMENT_CANCELLED" : "APPOINTMENT_STATUS_CHANGED");
    return AppointmentMapper.toDTO(updated);
  }

  private void recordStatusChange(Appointment appointment, String previousStatus,
      String nextStatus, String actor, String reason) {
    AppointmentStatusHistory history = new AppointmentStatusHistory();
    history.setId(UUID.randomUUID());
    history.setTenantId(appointment.getTenantId());
    history.setAppointmentId(appointment.getId());
    history.setChangedBy(actor);
    history.setChangedAt(OffsetDateTime.now());
    history.setPreviousStatus(previousStatus);
    history.setNewStatus(nextStatus);
    history.setReason(reason == null || reason.isBlank() ? null : reason.trim());
    statusHistoryRepository.save(history);
  }

  private void validateStatusTransition(String currentStatus, String nextStatus) {
    if (currentStatus.equals(nextStatus)) {
      return;
    }
    Set<String> allowedStatuses = ALLOWED_STATUS_TRANSITIONS.get(currentStatus);
    if (allowedStatuses == null || !allowedStatuses.contains(nextStatus)) {
      throw new InvalidAppointmentStatusException(
          "Cannot change appointment status from " + currentStatus + " to " + nextStatus);
    }
  }
}
