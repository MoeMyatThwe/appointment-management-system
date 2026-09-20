package com.pm.appointmentservice.repository;
import com.pm.appointmentservice.model.Customer;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
  long countByTenantId(String tenantId);
  List<Customer> findAllByTenantIdOrderByName(String tenantId);
  @Query("""
      select c from Customer c
      where c.tenantId = :tenant
        and (:search = '' or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%'))
          or lower(coalesce(c.phone, '')) like lower(concat('%', :search, '%')))
        and (:group = '' or lower(coalesce(c.customerGroup, '')) = lower(:group))
        and (:tag = '' or lower(coalesce(c.tags, '')) like lower(concat('%', :tag, '%')))
      """)
  Page<Customer> search(String tenant, String search, String group, String tag, Pageable pageable);
  Optional<Customer> findByIdAndTenantId(UUID id, String tenantId);
  Optional<Customer> findByTenantIdAndEmailIgnoreCase(String tenantId, String email);
}
