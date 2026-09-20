package com.pm.appointmentservice.repository;
import com.pm.appointmentservice.model.Staff;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
public interface StaffRepository extends JpaRepository<Staff, UUID> {
  long countByTenantId(String tenantId);
  List<Staff> findAllByTenantIdOrderByName(String tenantId);
  @Query("""
      select s from Staff s
      where s.tenantId = :tenant
        and (:search = '' or lower(s.name) like lower(concat('%', :search, '%'))
          or lower(coalesce(s.email, '')) like lower(concat('%', :search, '%'))
          or lower(coalesce(s.role, '')) like lower(concat('%', :search, '%')))
        and (:role = '' or lower(coalesce(s.role, '')) = lower(:role))
      """)
  Page<Staff> search(String tenant, String search, String role, Pageable pageable);
  Optional<Staff> findByIdAndTenantId(UUID id, String tenantId);
  Optional<Staff> findByIdAndTenantIdAndActiveTrue(UUID id, String tenantId);
}
