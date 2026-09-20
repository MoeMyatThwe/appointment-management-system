package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.service.CatalogService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import com.pm.appointmentservice.security.AccessPolicy;
import com.pm.appointmentservice.util.CatalogPageFilters;
import com.pm.appointmentservice.util.CatalogPagination;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import java.util.Set;

@RestController
public class CatalogController {
  private final CatalogService catalog;
  public CatalogController(CatalogService catalog) { this.catalog = catalog; }
  @GetMapping("/customers")
  public Object customers(@RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String direction,
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "") String group,
      @RequestParam(defaultValue = "") String tag) {
    AccessPolicy.requireBusinessUser(role);
    if (page == null && size == null && sortBy == null && direction == null && query.isBlank() && group.isBlank() && tag.isBlank()) {
      return catalog.customers(tenant);
    }
    Pageable pageable = CatalogPagination.request(page == null ? 0 : page, size == null ? 25 : size,
        sortBy, direction, "name", Set.of("name", "email"));
    return catalog.customers(tenant, pageable, new CatalogPageFilters(query, group, tag, null, null, null, null, null));
  }
  @PostMapping("/customers")
  public ResponseEntity<CustomerDTO> createCustomer(@RequestBody CustomerDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireBusinessUser(role);
    return ResponseEntity.ok(catalog.createCustomer(input, tenant));
  }
  @PutMapping("/customers/{id}")
  public ResponseEntity<CustomerDTO> updateCustomer(@PathVariable UUID id, @RequestBody CustomerDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireBusinessUser(role);
    return ResponseEntity.ok(catalog.updateCustomer(id, input, tenant));
  }
  @GetMapping("/customers/{id}/appointments")
  public Object customerAppointments(@PathVariable UUID id,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size) {
    AccessPolicy.requireBusinessUser(role);
    if (page == null && size == null) {
      return catalog.customerAppointments(id, tenant,
          CatalogPagination.request(0, 25, "startTime", "desc", "startTime", Set.of("startTime")));
    }
    return catalog.customerAppointments(id, tenant,
        CatalogPagination.request(page == null ? 0 : page, size == null ? 25 : size,
            "startTime", "desc", "startTime", Set.of("startTime")));
  }
  @GetMapping("/staff")
  public Object staff(@RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String userRole,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String direction,
      @RequestParam(defaultValue = "") String query,
      @RequestParam(name = "role", defaultValue = "") String staffRole) {
    AccessPolicy.requireBusinessUser(userRole);
    if (page == null && size == null && sortBy == null && direction == null && query.isBlank() && staffRole.isBlank()) {
      return catalog.staff(tenant);
    }
    Pageable pageable = CatalogPagination.request(page == null ? 0 : page, size == null ? 25 : size,
        sortBy, direction, "name", Set.of("name", "role"));
    return catalog.staff(tenant, pageable, new CatalogPageFilters(query, null, null, staffRole, null, null, null, null));
  }
  @PostMapping("/staff")
  public ResponseEntity<StaffDTO> createStaff(@RequestBody StaffDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.createStaff(input, tenant));
  }
  @PutMapping("/staff/{id}")
  public ResponseEntity<StaffDTO> updateStaff(@PathVariable UUID id, @RequestBody StaffDTO input,
      @RequestHeader("X-Tenant-ID") String tenant, @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.updateStaff(id, input, tenant));
  }
  @DeleteMapping("/staff/{id}")
  public ResponseEntity<Void> deleteStaff(@PathVariable UUID id, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    catalog.deleteStaff(id, tenant);
    return ResponseEntity.noContent().build();
  }
  @GetMapping("/staff/{id}/time-off")
  public Object staffTimeOff(@PathVariable String id,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size) {
    AccessPolicy.requireBusinessUser(role);
    return catalog.timeOff(tenant, id, CatalogPagination.request(page == null ? 0 : page,
        size == null ? 25 : size, "startTime", "desc", "startTime", Set.of("startTime")));
  }
  @GetMapping("/staff/{id}/appointments")
  public Page<AppointmentResponseDTO> staffAppointments(@PathVariable UUID id,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size) {
    AccessPolicy.requireBusinessUser(role);
    return catalog.staffAppointments(id, tenant, CatalogPagination.request(page == null ? 0 : page,
        size == null ? 25 : size, "startTime", "desc", "startTime", Set.of("startTime")));
  }
  @PostMapping("/staff/{id}/time-off")
  public ResponseEntity<StaffTimeOffDTO> addStaffTimeOff(@PathVariable String id,
      @RequestBody StaffTimeOffDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader(value = "X-Timezone", defaultValue = "UTC") String timezone) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.addTimeOff(tenant,
        new StaffTimeOffDTO(input.id(), id, input.startTime(), input.endTime(), input.reason()), timezone));
  }
  @GetMapping("/services")
  public Object services(@RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String direction,
      @RequestParam(defaultValue = "") String query,
      @RequestParam(required = false) Integer minDuration,
      @RequestParam(required = false) Integer maxDuration) {
    AccessPolicy.requireBusinessUser(role);
    if (page == null && size == null && sortBy == null && direction == null && query.isBlank()
        && minDuration == null && maxDuration == null) {
      return catalog.services(tenant);
    }
    Pageable pageable = CatalogPagination.request(page == null ? 0 : page, size == null ? 25 : size,
        sortBy, direction, "name", Set.of("name", "durationMinutes"));
    return catalog.services(tenant, pageable,
        new CatalogPageFilters(query, null, null, null, null, null, minDuration, maxDuration));
  }
  @PostMapping("/services")
  public ResponseEntity<ServiceDTO> createService(@RequestBody ServiceDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.createService(input, tenant));
  }
  @GetMapping("/resources")
  public Object resources(@RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String direction,
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "") String resourceType,
      @RequestParam(required = false) Boolean active) {
    AccessPolicy.requireBusinessUser(role);
    if (page == null && size == null && sortBy == null && direction == null && query.isBlank()
        && resourceType.isBlank() && active == null) {
      return catalog.resources(tenant);
    }
    Pageable pageable = CatalogPagination.request(page == null ? 0 : page, size == null ? 25 : size,
        sortBy, direction, "name", Set.of("name", "resourceType", "capacity"));
    return catalog.resources(tenant, pageable,
        new CatalogPageFilters(query, null, null, null, resourceType, active, null, null));
  }
  @PostMapping("/resources")
  public ResponseEntity<ResourceDTO> createResource(@RequestBody ResourceDTO input,
      @RequestHeader("X-Tenant-ID") String tenant, @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.createResource(input, tenant));
  }
}
