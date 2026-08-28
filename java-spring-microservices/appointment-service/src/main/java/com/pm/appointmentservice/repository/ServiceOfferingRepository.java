package com.pm.appointmentservice.repository;
import com.pm.appointmentservice.model.ServiceOffering;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {
  List<ServiceOffering> findAllByTenantIdOrderByName(String tenantId);
}
