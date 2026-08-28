package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.exception.TimeSlotAlreadyBookedException;
import com.pm.appointmentservice.mapper.AppointmentMapper;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.Customer;
import com.pm.appointmentservice.model.ServiceOffering;
import com.pm.appointmentservice.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicBookingService {
  private final CustomerRepository customers;
  private final StaffRepository staff;
  private final ServiceOfferingRepository services;
  private final AppointmentRepository appointments;
  private final ScheduleService schedule;
  private final AppointmentService appointmentService;

  public PublicBookingService(CustomerRepository customers, StaffRepository staff,
      ServiceOfferingRepository services, AppointmentRepository appointments,
      ScheduleService schedule, AppointmentService appointmentService) {
    this.customers = customers; this.staff = staff; this.services = services;
    this.appointments = appointments; this.schedule = schedule;
    this.appointmentService = appointmentService;
  }

  public PublicBookingCatalogDTO catalog(String tenant) {
    return new PublicBookingCatalogDTO(tenant,
        services.findAllByTenantIdOrderByName(tenant).stream()
            .map(s -> new ServiceDTO(s.getId().toString(), s.getName(), s.getDurationMinutes(), s.getPrice(), s.getColor())).toList(),
        staff.findAllByTenantIdOrderByName(tenant).stream()
            .map(s -> new StaffDTO(s.getId().toString(), s.getName(), s.getEmail(), s.getRole())).toList());
  }

  public List<PublicSlotDTO> slots(String tenant, LocalDate date, UUID serviceId, UUID staffId) {
    ServiceOffering service = services.findById(serviceId).filter(item -> tenant.equals(item.getTenantId()))
        .orElseThrow(() -> new IllegalArgumentException("Service not found"));
    if (staff.findById(staffId).filter(item -> tenant.equals(item.getTenantId())).isEmpty()) {
      throw new IllegalArgumentException("Staff member not found");
    }
    int duration = service.getDurationMinutes() == null || service.getDurationMinutes() < 1 ? 30 : service.getDurationMinutes();
    BusinessHoursDTO hours = schedule.getHours(tenant).stream()
        .filter(item -> item.dayOfWeek() == date.getDayOfWeek().getValue()).findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Business hours are not configured"));
    if (!hours.enabled() || hours.openTime() == null || schedule.getHolidays(tenant).stream().anyMatch(h -> date.equals(h.holidayDate()))) return List.of();
    List<PublicSlotDTO> result = new ArrayList<>();
    LocalDateTime cursor = LocalDateTime.of(date, hours.openTime());
    LocalDateTime close = LocalDateTime.of(date, hours.closeTime());
    while (!cursor.plusMinutes(duration).isAfter(close)) {
      LocalDateTime end = cursor.plusMinutes(duration);
      boolean inBreak = hours.breakStart() != null && cursor.toLocalTime().isBefore(hours.breakEnd())
          && end.toLocalTime().isAfter(hours.breakStart());
      boolean occupied = appointments.existsStaffOverlap(tenant, staffId.toString(),
          cursor.toString(), end.toString());
      if (!inBreak && !occupied) result.add(new PublicSlotDTO(cursor.toString(), end.toString()));
      cursor = cursor.plusMinutes(30);
    }
    return result;
  }

  @Transactional
  public AppointmentResponseDTO book(String tenant, PublicBookingRequestDTO input) {
    UUID serviceId = UUID.fromString(input.serviceId());
    UUID staffId = UUID.fromString(input.staffId());
    if (services.findById(serviceId).filter(s -> tenant.equals(s.getTenantId())).isEmpty()
        || staff.findById(staffId).filter(s -> tenant.equals(s.getTenantId())).isEmpty()) {
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
    return appointmentService.createAppointment(request, tenant);
  }
}
