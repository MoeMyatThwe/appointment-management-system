package com.pm.appointmentservice.repository;
import com.pm.appointmentservice.model.Staff;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StaffRepository extends JpaRepository<Staff, UUID> {
  List<Staff> findAllByTenantIdOrderByName(String tenantId);
  Optional<Staff> findByIdAndTenantId(UUID id, String tenantId);
}
