package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.BookableResource;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookableResourceRepository extends JpaRepository<BookableResource, UUID> {
  List<BookableResource> findAllByTenantIdOrderByName(String tenantId);
  Optional<BookableResource> findByIdAndTenantId(UUID id, String tenantId);
}
