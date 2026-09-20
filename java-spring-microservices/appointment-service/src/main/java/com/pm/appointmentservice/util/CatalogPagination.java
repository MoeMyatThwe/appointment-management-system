package com.pm.appointmentservice.util;

import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class CatalogPagination {
  private CatalogPagination() {}

  public static Pageable request(int page, int size, String sortBy, String direction,
      String defaultSort, Set<String> allowedSorts) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), 100);
    String property = sortBy != null && allowedSorts.contains(sortBy) ? sortBy : defaultSort;
    Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
        ? Sort.Direction.DESC : Sort.Direction.ASC;
    return PageRequest.of(safePage, safeSize, Sort.by(sortDirection, property));
  }
}
