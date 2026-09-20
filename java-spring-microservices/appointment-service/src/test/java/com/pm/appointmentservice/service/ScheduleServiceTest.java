package com.pm.appointmentservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pm.appointmentservice.exception.BusinessClosedException;
import com.pm.appointmentservice.repository.BusinessHolidayRepository;
import com.pm.appointmentservice.repository.BusinessHoursRepository;
import com.pm.appointmentservice.repository.StaffTimeOffRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ScheduleServiceTest {
  private BusinessHoursRepository hours;
  private BusinessHolidayRepository holidays;
  private ScheduleService service;

  @BeforeEach
  void setUp() {
    hours = mock(BusinessHoursRepository.class);
    holidays = mock(BusinessHolidayRepository.class);
    service = new ScheduleService(hours, holidays, mock(StaffTimeOffRepository.class));
    when(hours.findAllByTenantIdOrderByDayOfWeek("tenant")).thenReturn(List.of());
    when(holidays.existsByTenantIdAndHolidayDate("tenant", LocalDate.of(2025, 1, 6)))
        .thenReturn(false);
  }

  @Test
  void normalizesBusinessTimeToUtc() {
    assertEquals("2025-01-06T14:00:00Z",
        service.normalizeToUtc("2025-01-06T09:00", "America/New_York"));
  }

  @Test
  void rejectsDstGap() {
    assertThrows(BusinessClosedException.class,
        () -> service.normalizeToUtc("2025-03-09T02:30", "America/New_York"));
  }

  @Test
  void rejectsDstAmbiguousTime() {
    assertThrows(BusinessClosedException.class,
        () -> service.normalizeToUtc("2025-11-02T01:30", "America/New_York"));
  }

  @Test
  void rejectsAppointmentsShorterThanMinimum() {
    assertThrows(BusinessClosedException.class,
        () -> service.validateAppointmentWindow("tenant",
            "2025-01-06T09:00", "2025-01-06T09:10", "America/New_York"));
  }
}
