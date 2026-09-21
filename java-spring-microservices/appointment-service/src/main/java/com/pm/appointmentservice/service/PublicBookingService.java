package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.exception.TimeSlotAlreadyBookedException;
import com.pm.appointmentservice.mapper.AppointmentMapper;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.AppointmentIdempotencyKey;
import com.pm.appointmentservice.model.Customer;
import com.pm.appointmentservice.model.ServiceOffering;
import com.pm.appointmentservice.model.Staff;
import com.pm.appointmentservice.model.StaffTimeOff;
import com.pm.appointmentservice.model.PublicBookingToken;
import com.pm.appointmentservice.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class PublicBookingService {
  private final CustomerRepository customers;
  private final StaffRepository staff;
  private final ServiceOfferingRepository services;
  private final AppointmentRepository appointments;
  private final ScheduleService schedule;
  private final AppointmentService appointmentService;
  private final AppointmentIdempotencyKeyRepository idempotencyKeys;
  @Value("${appointment.booking-buffer-minutes:0}")
  private int bookingBufferMinutes;
  private final RestClient authClient;
  private final String internalServiceKey;
  private final PublicBookingTokenRepository publicTokens;
  private final SecureRandom random = new SecureRandom();

  public PublicBookingService(CustomerRepository customers, StaffRepository staff,
      ServiceOfferingRepository services, AppointmentRepository appointments,
      ScheduleService schedule, AppointmentService appointmentService,
      AppointmentIdempotencyKeyRepository idempotencyKeys,
      PublicBookingTokenRepository publicTokens,
      @Value("${auth.service.url:http://localhost:4005}") String authServiceUrl,
      @Value("${internal.service-key:}") String internalServiceKey) {
    this.customers = customers; this.staff = staff; this.services = services;
    this.appointments = appointments; this.schedule = schedule;
    this.appointmentService = appointmentService;
    this.idempotencyKeys = idempotencyKeys;
    this.publicTokens = publicTokens;
    this.authClient = RestClient.builder().baseUrl(authServiceUrl).build();
    this.internalServiceKey = internalServiceKey;
  }

  public PublicBookingCatalogDTO catalog(String tenant) {
    String businessName = authClient.get()
        .uri("/internal/tenants/{tenant}/name", tenant)
        .header("X-Internal-Service-Key", internalServiceKey)
        .retrieve().body(String.class);
    String timezone = authClient.get()
        .uri("/internal/tenants/{tenant}/timezone", tenant)
        .header("X-Internal-Service-Key", internalServiceKey)
        .retrieve().body(String.class);
    return new PublicBookingCatalogDTO(businessName == null || businessName.isBlank() ? "Book an appointment" : businessName,
        timezone == null || timezone.isBlank() ? "UTC" : timezone,
        services.findAllByTenantIdOrderByName(tenant).stream()
            .map(s -> new ServiceDTO(s.getId().toString(), s.getName(), s.getDurationMinutes(), s.getPrice(), s.getColor())).toList(),
        staff.findAllByTenantIdOrderByName(tenant).stream()
            .filter(Staff::isActive)
            .map(s -> new StaffDTO(s.getId().toString(), s.getName(), s.getEmail(), s.getRole(), s.isActive())).toList());
  }

  public List<PublicSlotDTO> slots(String tenant, LocalDate date, UUID serviceId, UUID staffId,
      String timezone) {
    ServiceOffering service = services.findById(serviceId).filter(item -> tenant.equals(item.getTenantId()))
        .orElseThrow(() -> new IllegalArgumentException("Service not found"));
    if (staff.findByIdAndTenantIdAndActiveTrue(staffId, tenant).isEmpty()) {
      throw new IllegalArgumentException("Staff member not found");
    }
    int duration = service.getDurationMinutes() == null || service.getDurationMinutes() < 1 ? 30 : service.getDurationMinutes();
    BusinessHoursDTO hours = schedule.getHours(tenant).stream()
        .filter(item -> item.dayOfWeek() == date.getDayOfWeek().getValue()).findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Business hours are not configured"));
    if (!hours.enabled() || hours.openTime() == null
        || schedule.isHoliday(tenant, date)) return List.of();
    List<PublicSlotDTO> result = new ArrayList<>();
    String businessTimezone = timezone;
    ZoneId zone = ZoneId.of(businessTimezone == null || businessTimezone.isBlank() ? "UTC" : businessTimezone);
    LocalDateTime cursor = LocalDateTime.of(date, hours.openTime());
    LocalDateTime close = LocalDateTime.of(date, hours.closeTime());
    String windowStart = cursor.minusMinutes(bookingBufferMinutes).atZone(zone).toInstant().toString();
    String windowEnd = close.plusMinutes(bookingBufferMinutes).atZone(zone).toInstant().toString();
    List<Appointment> appointmentsInWindow =
        appointments.findStaffOverlaps(tenant, staffId.toString(), windowStart, windowEnd);
    List<StaffTimeOff> timeOffInWindow =
        schedule.getOverlappingTimeOff(tenant, staffId.toString(), windowStart, windowEnd);
    while (!cursor.plusMinutes(duration).isAfter(close)) {
      LocalDateTime end = cursor.plusMinutes(duration);
      boolean inBreak = hours.breakStart() != null && cursor.toLocalTime().isBefore(hours.breakEnd())
          && end.toLocalTime().isAfter(hours.breakStart());
      String startUtc = cursor.atZone(zone).toInstant().toString();
      String endUtc = end.atZone(zone).toInstant().toString();
      String conflictStart = cursor.minusMinutes(bookingBufferMinutes).atZone(zone).toInstant().toString();
      String conflictEnd = end.plusMinutes(bookingBufferMinutes).atZone(zone).toInstant().toString();
      boolean occupied = appointmentsInWindow.stream()
          .anyMatch(item -> overlaps(item.getStartTime(), item.getEndTime(), conflictStart, conflictEnd));
      boolean staffUnavailable = timeOffInWindow.stream()
          .anyMatch(item -> overlaps(item.getStartTime(), item.getEndTime(), conflictStart, conflictEnd));
      if (!inBreak && !occupied && !staffUnavailable) result.add(new PublicSlotDTO(startUtc, endUtc));
      cursor = cursor.plusMinutes(30);
    }
    return result;
  }

  private boolean overlaps(String existingStart, String existingEnd, String requestedStart,
      String requestedEnd) {
    return existingStart.compareTo(requestedEnd) < 0 && existingEnd.compareTo(requestedStart) > 0;
  }

  @Transactional
  public AppointmentResponseDTO book(String tenant, PublicBookingRequestDTO input) {
    return book(tenant, input, null);
  }

  @Transactional
  public AppointmentResponseDTO book(String tenant, PublicBookingRequestDTO input,
      String idempotencyKey) {
    String normalizedKey = idempotencyKey == null ? null : idempotencyKey.trim();
    if (normalizedKey != null && normalizedKey.isBlank()) normalizedKey = null;
    if (normalizedKey != null && normalizedKey.length() > 128) {
      throw new IllegalArgumentException("Idempotency-Key must be 128 characters or fewer");
    }
    appointmentService.lockTenantBookings(tenant);
    if (normalizedKey != null) {
      var existing = idempotencyKeys.findByTenantIdAndIdempotencyKey(tenant, normalizedKey);
      if (existing.isPresent()) {
        return appointments.findByIdAndTenantId(existing.get().getAppointmentId(), tenant)
            .map(appointment -> withManagementToken(AppointmentMapper.toDTO(appointment), tenant))
            .orElseThrow(() -> new IllegalStateException("Stored booking result is unavailable"));
      }
    }
    UUID serviceId = UUID.fromString(input.serviceId());
    UUID staffId = UUID.fromString(input.staffId());
    if (services.findById(serviceId).filter(s -> tenant.equals(s.getTenantId())).isEmpty()
        || staff.findByIdAndTenantIdAndActiveTrue(staffId, tenant).isEmpty()) {
      throw new IllegalArgumentException("The selected service or staff member is unavailable");
    }
    Customer customer = customers.findByTenantIdAndEmailIgnoreCase(tenant, input.customerEmail())
        .orElseGet(Customer::new);
    customer.setTenantId(tenant); customer.setName(input.customerName().trim());
    customer.setEmail(input.customerEmail().trim().toLowerCase()); customer.setPhone(input.customerPhone());
    customer = customers.save(customer);
    AppointmentRequestDTO request = new AppointmentRequestDTO();
    request.setBusinessId(tenant); request.setCalendarId("public-booking");
    request.setCustomerId(customer.getId().toString()); request.setStaffId(staffId.toString());
    request.setServiceId(serviceId.toString()); request.setStartTime(input.startTime());
    request.setEndTime(input.endTime()); request.setStatus("PENDING"); request.setNotes(input.notes());
    String businessTimezone = authClient.get()
        .uri("/internal/tenants/{tenant}/timezone", tenant)
        .header("X-Internal-Service-Key", internalServiceKey)
        .retrieve().body(String.class);
    AppointmentResponseDTO result = appointmentService.createAppointment(request, tenant,
        businessTimezone == null || businessTimezone.isBlank() ? "UTC" : businessTimezone);
    String managementToken = issueManagementToken(tenant, UUID.fromString(result.getId()));
    result.setPublicManageToken(managementToken);
    if (normalizedKey != null) {
      AppointmentIdempotencyKey key = new AppointmentIdempotencyKey();
      key.setTenantId(tenant);
      key.setIdempotencyKey(normalizedKey);
      key.setAppointmentId(UUID.fromString(result.getId()));
      key.setCreatedAt(Instant.now().toString());
      idempotencyKeys.save(key);
    }
    return result;
  }

  public AppointmentResponseDTO getByManagementToken(String tenant, String token) {
    return withManagementToken(loadByToken(tenant, token), tenant);
  }

  @Transactional
  public AppointmentResponseDTO cancelByManagementToken(String tenant, String token) {
    AppointmentResponseDTO appointment = loadByToken(tenant, token);
    ensurePublicChangeAllowed(appointment, false);
    return appointmentService.changeStatus(UUID.fromString(appointment.getId()),
        new AppointmentStatusChangeDTO("CANCELLED", "Cancelled by customer"), tenant, "public-customer");
  }

  @Transactional
  public AppointmentResponseDTO rescheduleByManagementToken(String tenant, String token,
      AppointmentTimeChangeDTO timeChange, String timezone) {
    AppointmentResponseDTO appointment = loadByToken(tenant, token);
    ensurePublicChangeAllowed(appointment, true);
    AppointmentResponseDTO updated = appointmentService.rescheduleAppointment(
        UUID.fromString(appointment.getId()), timeChange, tenant, timezone);
    return withManagementToken(updated, tenant);
  }

  private AppointmentResponseDTO loadByToken(String tenant, String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      throw new IllegalArgumentException("Booking management token is required");
    }
    PublicBookingToken token = publicTokens
        .findByTokenHashAndTenantIdAndRevokedAtIsNull(hash(rawToken), tenant)
        .filter(item -> item.getExpiresAt().isAfter(Instant.now()))
        .orElseThrow(() -> new IllegalArgumentException("Booking link is invalid or expired"));
    return appointments.findByIdAndTenantId(token.getAppointmentId(), tenant)
        .map(AppointmentMapper::toDTO)
        .orElseThrow(() -> new IllegalArgumentException("Appointment is no longer available"));
  }

  private void ensurePublicChangeAllowed(AppointmentResponseDTO appointment, boolean reschedule) {
    if (!Set.of("PENDING", "CONFIRMED").contains(appointment.getStatus())) {
      throw new IllegalStateException("This appointment can no longer be changed online");
    }
    Instant start = Instant.parse(appointment.getStartTime());
    if (start.isBefore(Instant.now().plus(Duration.ofHours(2)))) {
      throw new IllegalStateException("Online changes close two hours before the appointment");
    }
  }

  private String issueManagementToken(String tenant, UUID appointmentId) {
    byte[] bytes = new byte[48];
    random.nextBytes(bytes);
    String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    PublicBookingToken record = new PublicBookingToken();
    record.setId(UUID.randomUUID());
    record.setTenantId(tenant);
    record.setAppointmentId(appointmentId);
    record.setTokenHash(hash(rawToken));
    record.setCreatedAt(Instant.now());
    record.setExpiresAt(Instant.now().plus(Duration.ofDays(90)));
    publicTokens.save(record);
    return rawToken;
  }

  private AppointmentResponseDTO withManagementToken(AppointmentResponseDTO appointment, String tenant) {
    return appointment;
  }

  private String hash(String value) {
    try {
      return Base64.getUrlEncoder().withoutPadding().encodeToString(
          MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException error) {
      throw new IllegalStateException("Booking token hashing is unavailable", error);
    }
  }
}
