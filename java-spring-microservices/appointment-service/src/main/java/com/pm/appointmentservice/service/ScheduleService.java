package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.BusinessHolidayDTO;
import com.pm.appointmentservice.dto.BusinessHoursDTO;
import com.pm.appointmentservice.dto.StaffTimeOffDTO;
import com.pm.appointmentservice.exception.BusinessClosedException;
import com.pm.appointmentservice.model.BusinessHoliday;
import com.pm.appointmentservice.model.BusinessHours;
import com.pm.appointmentservice.model.StaffTimeOff;
import com.pm.appointmentservice.repository.BusinessHolidayRepository;
import com.pm.appointmentservice.repository.BusinessHoursRepository;
import com.pm.appointmentservice.repository.StaffTimeOffRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.time.zone.ZoneRules;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class ScheduleService {
  private final BusinessHoursRepository hoursRepository;
  private final BusinessHolidayRepository holidayRepository;
  private final StaffTimeOffRepository timeOffRepository;

  public ScheduleService(BusinessHoursRepository hoursRepository,
      BusinessHolidayRepository holidayRepository, StaffTimeOffRepository timeOffRepository) {
    this.hoursRepository = hoursRepository;
    this.holidayRepository = holidayRepository;
    this.timeOffRepository = timeOffRepository;
  }

  public List<BusinessHoursDTO> getHours(String tenantId) {
    List<BusinessHours> stored = hoursRepository.findAllByTenantIdOrderByDayOfWeek(tenantId);
    if (stored.isEmpty()) {
      return defaultHours();
    }
    return stored.stream().map(this::toDTO).toList();
  }

  public List<BusinessHoursDTO> saveHours(String tenantId, List<BusinessHoursDTO> input) {
    if (input == null || input.size() != 7) {
      throw new IllegalArgumentException("Exactly seven days are required");
    }
    List<BusinessHoursDTO> saved = new ArrayList<>();
    for (BusinessHoursDTO day : input) {
      if (day.dayOfWeek() < 1 || day.dayOfWeek() > 7) {
        throw new IllegalArgumentException("Day of week must be between 1 and 7");
      }
      validateTimes(day);
      BusinessHours hours = hoursRepository.findByTenantIdAndDayOfWeek(tenantId, day.dayOfWeek())
          .orElseGet(BusinessHours::new);
      hours.setTenantId(tenantId);
      hours.setDayOfWeek(day.dayOfWeek());
      hours.setEnabled(day.enabled());
      hours.setOpenTime(day.openTime());
      hours.setCloseTime(day.closeTime());
      hours.setBreakStart(day.breakStart());
      hours.setBreakEnd(day.breakEnd());
      saved.add(toDTO(hoursRepository.save(hours)));
    }
    return saved;
  }

  public List<BusinessHolidayDTO> getHolidays(String tenantId) {
    return holidayRepository.findAllByTenantIdOrderByHolidayDate(tenantId).stream()
        .map(this::toDTO).toList();
  }

  public BusinessHolidayDTO addHoliday(String tenantId, BusinessHolidayDTO input) {
    if (holidayRepository.existsByTenantIdAndHolidayDate(tenantId, input.holidayDate())) {
      throw new IllegalArgumentException("A holiday already exists for this date");
    }
    BusinessHoliday holiday = new BusinessHoliday();
    holiday.setTenantId(tenantId);
    holiday.setHolidayDate(input.holidayDate());
    holiday.setName(input.name().trim());
    return toDTO(holidayRepository.save(holiday));
  }

  public Page<StaffTimeOffDTO> getTimeOff(String tenantId, String staffId, Pageable pageable) {
    return timeOffRepository.findAllByTenantIdAndStaffIdOrderByStartTimeDesc(tenantId, staffId, pageable)
        .map(item -> new StaffTimeOffDTO(item.getId().toString(), item.getStaffId(),
            item.getStartTime(), item.getEndTime(), item.getReason()));
  }

  public List<StaffTimeOffDTO> getTimeOff(String tenantId, String staffId) {
    return timeOffRepository.findAllByTenantIdAndStaffIdOrderByStartTimeDesc(tenantId, staffId,
        Pageable.unpaged()).stream()
        .map(item -> new StaffTimeOffDTO(item.getId().toString(), item.getStaffId(),
            item.getStartTime(), item.getEndTime(), item.getReason())).toList();
  }

  public StaffTimeOffDTO addTimeOff(String tenantId, StaffTimeOffDTO input, String timezone) {
    if (input.staffId() == null || input.staffId().isBlank()
        || input.startTime() == null || input.endTime() == null) {
      throw new IllegalArgumentException("Staff, start time, and end time are required");
    }
    String start = normalizeToUtc(input.startTime(), timezone);
    String end = normalizeToUtc(input.endTime(), timezone);
    if (!java.time.Instant.parse(end).isAfter(java.time.Instant.parse(start))) {
      throw new IllegalArgumentException("Time off end must be after its start");
    }
    StaffTimeOff item = new StaffTimeOff();
    item.setTenantId(tenantId);
    item.setStaffId(input.staffId());
    item.setStartTime(start);
    item.setEndTime(end);
    item.setReason(input.reason() == null ? null : input.reason().trim());
    StaffTimeOff saved = timeOffRepository.save(item);
    return new StaffTimeOffDTO(saved.getId().toString(), saved.getStaffId(),
        saved.getStartTime(), saved.getEndTime(), saved.getReason());
  }

  public boolean overlapsTimeOff(String tenantId, String staffId, String start, String end) {
    return timeOffRepository.existsByTenantIdAndStaffIdAndStartTimeLessThanAndEndTimeGreaterThan(
        tenantId, staffId, end, start);
  }

  public String normalizeToUtc(String value, String timezone) {
    return parseDateTime(value, parseZone(timezone)).toInstant().toString();
  }

  public void validateAppointmentWindow(String tenantId, String start, String end) {
    validateAppointmentWindow(tenantId, start, end, "UTC");
  }

  public void validateAppointmentWindow(String tenantId, String start, String end, String timezone) {
    ZoneId zone = parseZone(timezone);
    ZonedDateTime startAt = parseDateTime(start, zone);
    ZonedDateTime endAt = parseDateTime(end, zone);
    if (!endAt.isAfter(startAt)) {
      throw new BusinessClosedException("Appointment end time must be after its start time");
    }
    if (java.time.Duration.between(startAt.toInstant(), endAt.toInstant()).toMinutes() < 15) {
      throw new BusinessClosedException("Appointments must be at least 15 minutes long");
    }
    if (!startAt.toLocalDate().equals(endAt.toLocalDate())) {
      throw new BusinessClosedException("Appointments must start and end on the same day");
    }

    if (holidayRepository.existsByTenantIdAndHolidayDate(tenantId, startAt.toLocalDate())
        || holidayRepository.existsByTenantIdAndHolidayDate(tenantId, endAt.toLocalDate())) {
      throw new BusinessClosedException("The business is closed on this holiday");
    }
    BusinessHoursDTO hours = getHours(tenantId).stream()
        .filter(day -> day.dayOfWeek() == startAt.getDayOfWeek().getValue())
        .findFirst().orElseThrow(() -> new BusinessClosedException("Business hours are not configured"));
    if (!hours.enabled() || hours.openTime() == null || hours.closeTime() == null
        || startAt.toLocalTime().isBefore(hours.openTime())
        || endAt.toLocalTime().isAfter(hours.closeTime())
        || (hours.breakStart() != null && hours.breakEnd() != null
            && startAt.toLocalTime().isBefore(hours.breakEnd())
            && endAt.toLocalTime().isAfter(hours.breakStart()))) {
      throw new BusinessClosedException("The appointment is outside business hours");
    }
  }

  private void validateTimes(BusinessHoursDTO day) {
    if (!day.enabled()) return;
    if (day.openTime() == null || day.closeTime() == null || !day.closeTime().isAfter(day.openTime())) {
      throw new IllegalArgumentException("Open and close times are required for open days");
    }
    if ((day.breakStart() == null) != (day.breakEnd() == null)
        || (day.breakStart() != null && (!day.breakEnd().isAfter(day.breakStart())
            || day.breakStart().isBefore(day.openTime()) || day.breakEnd().isAfter(day.closeTime())))) {
      throw new IllegalArgumentException("Break must be within business hours");
    }
  }

  private List<BusinessHoursDTO> defaultHours() {
    List<BusinessHoursDTO> defaults = new ArrayList<>();
    for (int day = 1; day <= 7; day++) {
      boolean open = day <= 5;
      defaults.add(new BusinessHoursDTO(day, DayOfWeek.of(day).name(), open,
          open ? LocalTime.of(9, 0) : null, open ? LocalTime.of(17, 0) : null, null, null));
    }
    return defaults;
  }

  private BusinessHoursDTO toDTO(BusinessHours hours) {
    return new BusinessHoursDTO(hours.getDayOfWeek(), DayOfWeek.of(hours.getDayOfWeek()).name(),
        hours.isEnabled(), hours.getOpenTime(), hours.getCloseTime(), hours.getBreakStart(), hours.getBreakEnd());
  }

  private BusinessHolidayDTO toDTO(BusinessHoliday holiday) {
    return new BusinessHolidayDTO(holiday.getId().toString(), holiday.getHolidayDate(), holiday.getName());
  }

  private ZonedDateTime parseDateTime(String value, ZoneId zone) {
    try {
      if (value.contains("Z") || value.matches(".*[+-]\\d{2}:\\d{2}$")) {
        return java.time.OffsetDateTime.parse(value).toInstant().atZone(zone);
      }
      LocalDateTime local = LocalDateTime.parse(value);
      ZoneRules rules = zone.getRules();
      if (rules.getValidOffsets(local).size() != 1) {
        throw new BusinessClosedException("Appointment time falls in a daylight-saving transition");
      }
      return ZonedDateTime.ofLocal(local, zone, rules.getValidOffsets(local).get(0));
    } catch (DateTimeParseException localDateTimeException) {
      throw new BusinessClosedException("Appointment times must be valid date and time values");
    }
  }

  private ZoneId parseZone(String timezone) {
    try {
      return ZoneId.of(timezone == null || timezone.isBlank() ? "UTC" : timezone);
    } catch (java.time.DateTimeException exception) {
      throw new BusinessClosedException("Business time zone is invalid");
    }
  }
}
