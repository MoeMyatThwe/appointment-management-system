package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.BusinessHolidayDTO;
import com.pm.appointmentservice.dto.BusinessHoursDTO;
import com.pm.appointmentservice.exception.BusinessClosedException;
import com.pm.appointmentservice.model.BusinessHoliday;
import com.pm.appointmentservice.model.BusinessHours;
import com.pm.appointmentservice.repository.BusinessHolidayRepository;
import com.pm.appointmentservice.repository.BusinessHoursRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ScheduleService {
  private final BusinessHoursRepository hoursRepository;
  private final BusinessHolidayRepository holidayRepository;

  public ScheduleService(BusinessHoursRepository hoursRepository,
      BusinessHolidayRepository holidayRepository) {
    this.hoursRepository = hoursRepository;
    this.holidayRepository = holidayRepository;
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

  public void validateAppointmentWindow(String tenantId, String start, String end) {
    LocalDateTime startAt = parseDateTime(start);
    LocalDateTime endAt = parseDateTime(end);
    if (!endAt.isAfter(startAt)) {
      throw new BusinessClosedException("Appointment end time must be after its start time");
    }
    if (holidayRepository.existsByTenantIdAndHolidayDate(tenantId, startAt.toLocalDate())) {
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

  private LocalDateTime parseDateTime(String value) {
    try {
      return LocalDateTime.parse(value);
    } catch (DateTimeParseException ignored) {
      return java.time.OffsetDateTime.parse(value).toLocalDateTime();
    }
  }
}
