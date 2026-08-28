package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.BusinessHolidayDTO;
import com.pm.appointmentservice.dto.BusinessHoursDTO;
import com.pm.appointmentservice.service.ScheduleService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.pm.appointmentservice.security.AccessPolicy;

@RestController
@RequestMapping("/settings")
public class ScheduleController {
  private final ScheduleService scheduleService;

  public ScheduleController(ScheduleService scheduleService) {
    this.scheduleService = scheduleService;
  }

  @GetMapping("/business-hours")
  public List<BusinessHoursDTO> getHours(@RequestHeader("X-Tenant-ID") String tenantId) {
    return scheduleService.getHours(tenantId);
  }

  @PutMapping("/business-hours")
  public List<BusinessHoursDTO> saveHours(@RequestHeader("X-Tenant-ID") String tenantId,
      @RequestBody List<BusinessHoursDTO> hours, @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return scheduleService.saveHours(tenantId, hours);
  }

  @GetMapping("/holidays")
  public List<BusinessHolidayDTO> getHolidays(@RequestHeader("X-Tenant-ID") String tenantId) {
    return scheduleService.getHolidays(tenantId);
  }

  @PostMapping("/holidays")
  public ResponseEntity<BusinessHolidayDTO> addHoliday(@RequestHeader("X-Tenant-ID") String tenantId,
      @RequestBody BusinessHolidayDTO holiday, @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(scheduleService.addHoliday(tenantId, holiday));
  }
}
