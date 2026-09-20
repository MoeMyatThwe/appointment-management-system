package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.BookableResource;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

public interface BookableResourceRepository extends JpaRepository<BookableResource, UUID> {
  List<BookableResource> findAllByTenantIdOrderByName(String tenantId);
  @Query("""
      select r from BookableResource r
      where r.tenantId = :tenant
        and (:search = '' or lower(r.name) like lower(concat('%', :search, '%'))
          or lower(coalesce(r.description, '')) like lower(concat('%', :search, '%')))
        and (:resourceType = '' or r.resourceType = :resourceType)
        and (:active is null or r.active = :active)
      """)
  Page<BookableResource> search(String tenant, String search, String resourceType, Boolean active, Pageable pageable);
  Optional<BookableResource> findByIdAndTenantId(UUID id, String tenantId);
}
