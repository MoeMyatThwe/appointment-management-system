package com.pm.appointmentservice.repository;
import com.pm.appointmentservice.model.Customer;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
  List<Customer> findAllByTenantIdOrderByName(String tenantId);
  Optional<Customer> findByIdAndTenantId(UUID id, String tenantId);
  Optional<Customer> findByTenantIdAndEmailIgnoreCase(String tenantId, String email);
}
