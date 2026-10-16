package com.pm.appointmentservice.repository;
import com.pm.appointmentservice.model.ServiceOffering;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {
  long countByTenantId(String tenantId);
  List<ServiceOffering> findAllByTenantIdOrderByName(String tenantId);
  @Query("select distinct s.tenantId from ServiceOffering s order by s.tenantId")
  List<String> findDistinctTenantIds();
  @Query("""
      select s from ServiceOffering s
      where s.tenantId = :tenant
        and (:search = '' or lower(s.name) like lower(concat('%', :search, '%')))
        and coalesce(s.durationMinutes, 0) between :minDuration and :maxDuration
      """)
  Page<ServiceOffering> search(String tenant, String search, int minDuration, int maxDuration, Pageable pageable);
}
