package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.model.*;
import com.pm.appointmentservice.repository.*;
import java.util.List;
import org.springframework.stereotype.Service;
import java.util.UUID;
import com.pm.appointmentservice.dto.AppointmentResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.pm.appointmentservice.util.CatalogPageFilters;

@Service
public class CatalogService {
  private final CustomerRepository customers;
  private final StaffRepository staff;
  private final ServiceOfferingRepository services;
  private final BookableResourceRepository resources;
  private final AppointmentRepository appointments;
  private final ScheduleService schedule;
  public CatalogService(CustomerRepository customers, StaffRepository staff, ServiceOfferingRepository services,
      BookableResourceRepository resources, AppointmentRepository appointments, ScheduleService schedule) {
    this.customers = customers; this.staff = staff; this.services = services;
    this.resources = resources; this.appointments = appointments;
    this.schedule = schedule;
  }
  public List<CustomerDTO> customers(String tenant) {
    return customers.findAllByTenantIdOrderByName(tenant).stream()
        .map(c -> toCustomerDTO(c)).toList();
  }
  public Page<CustomerDTO> customers(String tenant, Pageable pageable, CatalogPageFilters filters) {
    return customers.search(tenant, filters.searchValue(), filters.groupValue(), filters.tagValue(), pageable)
        .map(this::toCustomerDTO);
  }
  public CustomerDTO createCustomer(CustomerDTO input, String tenant) {
    Customer c = new Customer(); c.setTenantId(tenant); c.setName(input.name()); c.setEmail(input.email());
    c.setPhone(input.phone()); c.setNotes(input.notes()); c.setCustomerGroup(input.customerGroup());
    c.setTags(input.tags()); c = customers.save(c);
    return toCustomerDTO(c);
  }
  public CustomerDTO updateCustomer(UUID id, CustomerDTO input, String tenant) {
    Customer c = customers.findByIdAndTenantId(id, tenant).orElseThrow();
    c.setName(input.name()); c.setEmail(input.email()); c.setPhone(input.phone()); c.setNotes(input.notes());
    c.setCustomerGroup(input.customerGroup()); c.setTags(input.tags());
    c = customers.save(c);
    return toCustomerDTO(c);
  }
  public List<StaffDTO> staff(String tenant) {
    return staff.findAllByTenantIdOrderByName(tenant).stream()
        .map(s -> new StaffDTO(s.getId().toString(), s.getName(), s.getEmail(), s.getRole(), s.isActive())).toList();
  }
  public Page<StaffDTO> staff(String tenant, Pageable pageable, CatalogPageFilters filters) {
    return staff.search(tenant, filters.searchValue(), filters.roleValue(), pageable)
        .map(s -> new StaffDTO(s.getId().toString(), s.getName(), s.getEmail(), s.getRole(), s.isActive()));
  }
  public Page<StaffTimeOffDTO> timeOff(String tenant, String staffId, Pageable pageable) {
    return schedule.getTimeOff(tenant, staffId, pageable);
  }
  public StaffTimeOffDTO addTimeOff(String tenant, StaffTimeOffDTO input, String timezone) {
    return schedule.addTimeOff(tenant, input, timezone);
  }
  public StaffDTO createStaff(StaffDTO input, String tenant) {
    Staff s = new Staff(); s.setTenantId(tenant); s.setName(input.name()); s.setEmail(input.email()); s.setRole(input.role());
    s.setActive(input.active() == null || input.active());
    s = staff.save(s); return new StaffDTO(s.getId().toString(), s.getName(), s.getEmail(), s.getRole(), s.isActive());
  }
  public StaffDTO updateStaff(UUID id, StaffDTO input, String tenant) {
    Staff s = staff.findByIdAndTenantId(id, tenant).orElseThrow();
    s.setName(input.name()); s.setEmail(input.email()); s.setRole(input.role());
    if (input.active() != null) s.setActive(input.active());
    s = staff.save(s);
    return new StaffDTO(s.getId().toString(), s.getName(), s.getEmail(), s.getRole(), s.isActive());
  }
  public void deleteStaff(UUID id, String tenant) {
    Staff s = staff.findByIdAndTenantId(id, tenant).orElseThrow();
    s.setActive(false);
    staff.save(s);
  }
  public List<ServiceDTO> services(String tenant) {
    return services.findAllByTenantIdOrderByName(tenant).stream()
        .map(s -> new ServiceDTO(s.getId().toString(), s.getName(), s.getDurationMinutes(), s.getPrice(), s.getColor())).toList();
  }
  public Page<ServiceDTO> services(String tenant, Pageable pageable, CatalogPageFilters filters) {
    return services.search(tenant, filters.searchValue(), filters.minDurationValue(), filters.maxDurationValue(), pageable)
        .map(s -> new ServiceDTO(s.getId().toString(), s.getName(), s.getDurationMinutes(), s.getPrice(), s.getColor()));
  }
  public ServiceDTO createService(ServiceDTO input, String tenant) {
    ServiceOffering s = new ServiceOffering(); s.setTenantId(tenant); s.setName(input.name());
    s.setDurationMinutes(input.durationMinutes()); s.setPrice(input.price()); s.setColor(input.color());
    s = services.save(s);
    return new ServiceDTO(s.getId().toString(), s.getName(), s.getDurationMinutes(), s.getPrice(), s.getColor());
  }

  public List<ResourceDTO> resources(String tenant) {
    return resources.findAllByTenantIdOrderByName(tenant).stream()
        .map(r -> new ResourceDTO(r.getId().toString(), r.getName(), r.getResourceType(),
            r.getDescription(), r.getCapacity(), r.isActive())).toList();
  }
  public Page<ResourceDTO> resources(String tenant, Pageable pageable, CatalogPageFilters filters) {
    return resources.search(tenant, filters.searchValue(), filters.resourceTypeValue(), filters.active(), pageable)
        .map(r -> new ResourceDTO(r.getId().toString(), r.getName(), r.getResourceType(),
            r.getDescription(), r.getCapacity(), r.isActive()));
  }

  public ResourceDTO createResource(ResourceDTO input, String tenant) {
    BookableResource resource = new BookableResource();
    resource.setTenantId(tenant);
    resource.setName(input.name());
    resource.setResourceType(input.resourceType());
    resource.setDescription(input.description());
    resource.setCapacity(input.capacity() == null || input.capacity() < 1 ? 1 : input.capacity());
    resource.setActive(input.active());
    resource = resources.save(resource);
    return new ResourceDTO(resource.getId().toString(), resource.getName(), resource.getResourceType(),
        resource.getDescription(), resource.getCapacity(), resource.isActive());
  }

  public Page<AppointmentResponseDTO> customerAppointments(UUID customerId, String tenant, Pageable pageable) {
    return appointments.findAllByTenantIdAndCustomerIdOrderByStartTimeDesc(tenant, customerId.toString(), pageable)
        .map(com.pm.appointmentservice.mapper.AppointmentMapper::toDTO);
  }

  public Page<AppointmentResponseDTO> staffAppointments(UUID staffId, String tenant, Pageable pageable) {
    return appointments.findAllByTenantIdAndStaffIdOrderByStartTimeDesc(tenant, staffId.toString(), pageable)
        .map(com.pm.appointmentservice.mapper.AppointmentMapper::toDTO);
  }

  private CustomerDTO toCustomerDTO(Customer customer) {
    return new CustomerDTO(customer.getId().toString(), customer.getName(), customer.getEmail(),
        customer.getPhone(), customer.getNotes(), customer.getCustomerGroup(), customer.getTags());
  }
}
