package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.service.CatalogService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import com.pm.appointmentservice.security.AccessPolicy;

@RestController
public class CatalogController {
  private final CatalogService catalog;
  public CatalogController(CatalogService catalog) { this.catalog = catalog; }
  @GetMapping("/customers")
  public List<CustomerDTO> customers(@RequestHeader("X-Tenant-ID") String tenant) { return catalog.customers(tenant); }
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
  public List<AppointmentResponseDTO> customerAppointments(@PathVariable UUID id,
      @RequestHeader("X-Tenant-ID") String tenant) {
    return catalog.customerAppointments(id, tenant);
  }
  @GetMapping("/staff")
  public List<StaffDTO> staff(@RequestHeader("X-Tenant-ID") String tenant) { return catalog.staff(tenant); }
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
  @GetMapping("/services")
  public List<ServiceDTO> services(@RequestHeader("X-Tenant-ID") String tenant) { return catalog.services(tenant); }
  @PostMapping("/services")
  public ResponseEntity<ServiceDTO> createService(@RequestBody ServiceDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.createService(input, tenant));
  }
  @GetMapping("/resources")
  public List<ResourceDTO> resources(@RequestHeader("X-Tenant-ID") String tenant) {
    return catalog.resources(tenant);
  }
  @PostMapping("/resources")
  public ResponseEntity<ResourceDTO> createResource(@RequestBody ResourceDTO input,
      @RequestHeader("X-Tenant-ID") String tenant, @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(catalog.createResource(input, tenant));
  }
}
