package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.AppointmentEventOutbox;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface AppointmentEventOutboxRepository extends JpaRepository<AppointmentEventOutbox, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  List<AppointmentEventOutbox> findTop50ByStatusOrderByCreatedAtAsc(String status);
  long countByStatus(String status);
  int deleteByStatusAndPublishedAtBefore(String status, String publishedAt);
}
