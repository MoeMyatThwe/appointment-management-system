package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.mapper.AppointmentMapper;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.ServiceOffering;
import com.pm.appointmentservice.repository.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ReportingService {
  private final AppointmentRepository appointments;
  private final CustomerRepository customers;
  private final StaffRepository staff;
  private final ServiceOfferingRepository services;

  public ReportingService(AppointmentRepository appointments, CustomerRepository customers,
      StaffRepository staff, ServiceOfferingRepository services) {
    this.appointments = appointments;
    this.customers = customers;
    this.staff = staff;
    this.services = services;
  }

  public DashboardSummaryDTO dashboard(String tenantId, String timezone) {
    ZoneId zone = ZoneId.of(timezone == null || timezone.isBlank() ? "UTC" : timezone);
    LocalDate today = LocalDate.now(zone);
    String start = today.atStartOfDay(zone).toInstant().toString();
    String end = today.plusDays(1).atStartOfDay(zone).toInstant().toString();
    String now = java.time.Instant.now().toString();
    return new DashboardSummaryDTO(
        appointments.countByTenantIdAndStartTimeGreaterThanEqualAndStartTimeLessThanAndStatusNot(
            tenantId, start, end, "CANCELLED"),
        appointments.countByTenantIdAndStartTimeGreaterThanEqualAndStatusNot(tenantId, now, "CANCELLED"),
        appointments.countByTenantIdAndStatus(tenantId, "COMPLETED"),
        appointments.countByTenantIdAndStatus(tenantId, "CANCELLED"),
        customers.countByTenantId(tenantId),
        staff.countByTenantId(tenantId),
        services.countByTenantId(tenantId),
        appointments.findTop5ByTenantIdAndStartTimeGreaterThanEqualAndStatusNotOrderByStartTimeAsc(
                tenantId, now, "CANCELLED").stream().map(AppointmentMapper::toDTO).toList());
  }

  public ReportSummaryDTO report(String tenantId, String from, String to) {
    String start = from == null || from.isBlank() ? "" : from.trim();
    String end = to == null || to.isBlank() ? "" : to.trim();
    List<Appointment> records = appointments.findForReport(tenantId, start, end);
    long upcoming = records.stream().filter(item -> !"CANCELLED".equals(item.getStatus())
        && item.getStartTime() != null && item.getStartTime().compareTo(java.time.Instant.now().toString()) >= 0).count();
    long completed = records.stream().filter(item -> "COMPLETED".equals(item.getStatus())).count();
    long cancelled = records.stream().filter(item -> "CANCELLED".equals(item.getStatus())).count();
    List<ServiceDemandDTO> demand = services.findAllByTenantIdOrderByName(tenantId).stream()
        .map(service -> new ServiceDemandDTO(service.getId().toString(), service.getName(),
            records.stream().filter(item -> service.getId().toString().equals(item.getServiceId())).count()))
        .toList();
    return new ReportSummaryDTO(records.size(), upcoming, completed, cancelled,
        customers.countByTenantId(tenantId), demand);
  }

  public String exportAppointments(String tenantId, String from, String to) {
    List<Appointment> records = appointments.findForReport(tenantId,
        from == null ? "" : from.trim(), to == null ? "" : to.trim());
    StringBuilder csv = new StringBuilder("Appointment ID,Customer ID,Staff ID,Service ID,Start,End,Status,Notes\n");
    records.forEach(item -> csv.append(csv(item.getId())).append(',')
        .append(csv(item.getCustomerId())).append(',').append(csv(item.getStaffId())).append(',')
        .append(csv(item.getServiceId())).append(',').append(csv(item.getStartTime())).append(',')
        .append(csv(item.getEndTime())).append(',').append(csv(item.getStatus())).append(',')
        .append(csv(item.getNotes())).append('\n'));
    return csv.toString();
  }

  public String exportCustomers(String tenantId) {
    StringBuilder csv = new StringBuilder("Customer ID,Name,Email,Phone,Group,Tags,Notes\n");
    customers.findAllByTenantIdOrderByName(tenantId).forEach(item -> csv.append(csv(item.getId())).append(',')
        .append(csv(item.getName())).append(',').append(csv(item.getEmail())).append(',')
        .append(csv(item.getPhone())).append(',').append(csv(item.getCustomerGroup())).append(',')
        .append(csv(item.getTags())).append(',').append(csv(item.getNotes())).append('\n'));
    return csv.toString();
  }

  private String csv(Object value) {
    String text = value == null ? "" : String.valueOf(value);
    return "\"" + text.replace("\"", "\"\"") + "\"";
  }
}
